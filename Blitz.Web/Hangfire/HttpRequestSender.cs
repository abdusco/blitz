using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Mime;
using System.Threading;
using System.Threading.Tasks;
using Blitz.Web.Cronjobs;
using Blitz.Web.Persistence;
using IdentityModel.Client;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Blitz.Web.Hangfire
{
    public class HttpRequestSender
    {
        private readonly IHttpClientFactory _clientFactory;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<HttpRequestSender> _logger;
        private readonly TokenCache _tokenCache;

        public HttpRequestSender(IServiceScopeFactory scopeFactory,
                                 ILogger<HttpRequestSender> logger,
                                 IHttpClientFactory clientFactory,
                                 TokenCache tokenCache)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _clientFactory = clientFactory;
            _tokenCache = tokenCache;
        }

        public async Task SendRequestAsync(Guid cronjobId,
                                           Guid executionId = default,
                                           CancellationToken cancellationToken = default)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<BlitzDbContext>();
            var cronjob = await db.Cronjobs.Include(e => e.Project).SingleOrDefaultAsync(c => c.Id == cronjobId, cancellationToken);
            if (cronjob is null)
            {
                _logger.LogError("Cannot find a cronjob record with id={CronjobId}", cronjobId);
                return;
            }

            using var _ = _logger.BeginScope("Running cronjob={CronjobTitle}", cronjob.Title);

            // make sure execution is saved to db
            await Task.Delay(TimeSpan.FromSeconds(1.5), cancellationToken);

            var exec = await db.Executions
                .Include(e => e.Updates.OrderByDescending(u => u.CreatedAt).Take(1))
                .SingleOrDefaultAsync(e => e.Id == executionId, cancellationToken);

            if (exec is null)
            {
                if (executionId == Guid.Empty)
                {
                    executionId = Guid.NewGuid();
                }

                exec = new Execution(cronjob) { Id = executionId };
                await db.AddAsync(exec, cancellationToken);
            }

            _logger.LogInformation("Executing id={ExecutionId}", exec.Id);

            exec.UpdateStatus(ExecutionState.Pending);
            await db.SaveChangesAsync(cancellationToken);

            var method = cronjob.HttpMethod.ToUpperInvariant() switch
            {
                "GET" => HttpMethod.Get,
                "POST" => HttpMethod.Post,
                _ => throw new Exception("Unsupported HTTP method")
            };

            var timer = Stopwatch.StartNew();

            var http = _clientFactory.CreateClient(nameof(HttpRequestSender));

            if (cronjob.IsAuthenticated && cronjob.EffectiveAuth != null)
            {
                var auth = cronjob.EffectiveAuth;
                var key = $"{auth.TokenEndpoint}:{auth.ClientId}:{auth.Scope}";
                var token = await _tokenCache.GetOrCreateAsync(key, async () =>
                {
                    _logger.LogInformation("Requesting access token from {TokenEndpoint}", cronjob.EffectiveAuth.TokenEndpoint);
                    var tokenResult = await http.RequestClientCredentialsTokenAsync(new ClientCredentialsTokenRequest
                    {
                        Address = cronjob.EffectiveAuth.TokenEndpoint,
                        ClientId = cronjob.EffectiveAuth.ClientId,
                        ClientSecret = cronjob.EffectiveAuth.ClientSecret,
                        Scope = cronjob.EffectiveAuth.Scope,
                    }, cancellationToken: cancellationToken);
                    return tokenResult.AccessToken;
                });
                http.SetBearerToken(token);
            }

            try
            {
                var now = DateTime.UtcNow;

                var req = new HttpRequestMessage(method, cronjob.Url);
                req.Headers.Add("Execution-Id", exec.Id.ToString());

                var response = await http.SendAsync(req, cancellationToken);

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
                            ["Body"] = response.Content!.Headers.ContentType?.MediaType == MediaTypeNames.Application.Json
                                ? await response.Content.ReadAsStringAsync(cancellationToken)
                                : null
                        }
                    }
                );
                if (!response.IsSuccessStatusCode)
                {
                    exec.UpdateStatus(
                        new ExecutionStatus(exec, ExecutionState.Failed)
                        {
                            CreatedAt = DateTime.UtcNow,
                            Details = new Dictionary<string, object>
                            {
                                ["StatusCode"] = response.StatusCode,
                                ["Message"] = "Response did not return a success status code"
                            }
                        }
                    );
                }
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
                _logger.LogInformation("Saving execution id={ExecutionId}", exec.Id);
                await db.SaveChangesAsync(cancellationToken);
            }
        }
    }
}