using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Blitz.Web.Cronjobs;
using Blitz.Web.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Blitz.Web.Hangfire
{
    public class HttpRequestJob
    {
        private readonly HttpClient _http;
        private readonly IServiceScopeFactory _scopeFactory;

        public HttpRequestJob(HttpClient http, IServiceScopeFactory scopeFactory)
        {
            _http = http;
            _scopeFactory = scopeFactory;
        }

        public async Task SendRequestAsync(Guid cronjobId, Guid executionId = default, CancellationToken cancellationToken = default)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<BlitzDbContext>();
            var cronjob = await db.Cronjobs.SingleAsync(c => c.Id == cronjobId, cancellationToken);

            var method = cronjob.HttpMethod.ToUpperInvariant() switch
            {
                "GET" => HttpMethod.Get,
                "POST" => HttpMethod.Post,
                _ => throw new Exception("Unsupported HTTP method")
            };

            var execution = await db.Executions.SingleOrDefaultAsync(e => e.Id == executionId, cancellationToken)
                ?? new Execution();
            if (executionId != Guid.Empty)
            {
                execution = ;
            }
            else
            {
                execution = new Execution(cronjob) {Id = Guid.NewGuid()};
                await db.AddAsync(execution, cancellationToken);
            }

            execution.UpdateStatus(ExecutionState.Pending);

            var req = new HttpRequestMessage(method, cronjob.Url);
            req.Headers.Add("X-Execution-Id", execution.Id.ToString());

            var timer = Stopwatch.StartNew();
            try
            {
                var response = await _http.SendAsync(req, cancellationToken);
                timer.Stop();
                execution.UpdateStatus(
                    ExecutionState.Triggered, new Dictionary<string, object>
                    {
                        ["StatusCode"] = response.StatusCode,
                        ["Headers"] = response.Headers.ToDictionary(h => h.Key, h => h.Value.FirstOrDefault()),
                        ["Elapsed"] = timer.ElapsedMilliseconds
                    }
                );
            }
            catch (Exception e)
            {
                if (timer.IsRunning)
                {
                    timer.Stop();
                }

                execution.UpdateStatus(
                    ExecutionState.Failed,
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
                await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
                await db.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);
            }
        }
    }
}