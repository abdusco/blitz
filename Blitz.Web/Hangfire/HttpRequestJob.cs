using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Blitz.Web.Cronjobs;
using Blitz.Web.Persistence;
using Hangfire.Server;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Blitz.Web.Hangfire
{
    public class HttpRequestJob
    {
        private readonly HttpClient _http;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<HttpRequestJob> _logger;

        public HttpRequestJob(HttpClient http, IServiceScopeFactory scopeFactory, ILogger<HttpRequestJob> logger)
        {
            _http = http;
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public async Task SendRequestAsync(Guid cronjobId,
                                           Guid executionId = default,
                                           PerformContext context = null,
                                           CancellationToken cancellationToken = default)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<BlitzDbContext>();
            var cronjob = await db.Cronjobs.SingleOrDefaultAsync(c => c.Id == cronjobId, cancellationToken);
            if (cronjob is null)
            {
                _logger.LogInformation("Cannot find a cronjob record with id={CronjobId}", cronjobId);
                return;
            }

            _logger.LogInformation("Received cronjob: {CronjobTitle}", cronjob.Title);

            Execution exec = null;
            if (executionId != Guid.Empty)
            {
                exec = await db.Executions
                    .Include(e => e.Updates.OrderByDescending(u => u.CreatedAt).Take(1))
                    .SingleOrDefaultAsync(e => e.Id == executionId, cancellationToken);
            }

            if (exec is null)
            {
                exec = new Execution(cronjob) {Id = executionId = Guid.NewGuid()};
                await db.AddAsync(exec, cancellationToken);
            }

            _logger.LogInformation("Executing {ExecutionId} for {CronjobTitle} ({CronjobId})", exec.Id, cronjob.Title, cronjobId);

            exec.UpdateStatus(ExecutionState.Pending);
            await using (var tx = await db.Database.BeginTransactionAsync(cancellationToken))
            {
                await db.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);
            }

            var method = cronjob.HttpMethod.ToUpperInvariant() switch
            {
                "GET" => HttpMethod.Get,
                "POST" => HttpMethod.Post,
                _ => throw new Exception("Unsupported HTTP method")
            };

            var timer = Stopwatch.StartNew();
            try
            {
                var now = DateTime.UtcNow;

                var req = new HttpRequestMessage(method, cronjob.Url);
                req.Headers.Add("X-Execution-Id", exec.Id.ToString());
                var response = await _http.SendAsync(req, cancellationToken);
                timer.Stop();
                exec.UpdateStatus(
                    new ExecutionStatus(exec, ExecutionState.Triggered)
                    {
                        CreatedAt = now,
                        Details = new Dictionary<string, object>
                        {
                            ["StatusCode"] = response.StatusCode,
                            ["Headers"] = response.Headers.ToDictionary(h => h.Key, h => h.Value.FirstOrDefault()),
                            ["Elapsed"] = timer.ElapsedMilliseconds,
                            ["Body"] = response.Content.ToString()
                        }
                    }
                );
            }
            catch (Exception e)
            {
                timer.Stop();

                var state = e switch
                {
                    TaskCanceledException => ExecutionState.TimedOut,
                    WebException => ExecutionState.TimedOut,
                    _ => ExecutionState.Failed
                };
                exec.UpdateStatus(
                    state,
                    new Dictionary<string, object>
                    {
                        ["ExceptionMessage"] = e.Message,
                        ["ExceptionSource"] = e.Source,
                        ["ExceptionStackTrace"] = e.StackTrace,
                        ["Elapsed"] = timer.ElapsedMilliseconds
                    }
                );
                throw;
            }
            finally
            {
                _logger.LogInformation("Saving execution={ExecutionId}", exec.Id);
                await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
                await db.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);
            }
        }
    }
}