using System;
using System.Data;
using System.Net.Http;
using System.Threading.Tasks;
using Hangfire;

namespace Blitz.Web.Cronjobs
{
    public interface ICronjobRegistrationService
    {
        Task Add(Cronjob cronjob);
        Task Remove(Cronjob cronjob);
    }

    internal static class CronjobExtensions
    {
        public static string GetHangfireId(this Cronjob cronjob) => $"{cronjob.Title}.{cronjob.Id}";
    }

    public class HangfireCronjobRegistrationService : ICronjobRegistrationService
    {
        private readonly IRecurringJobManager _recurringJobManager;

        public HangfireCronjobRegistrationService(IRecurringJobManager recurringJobManager)
        {
            _recurringJobManager = recurringJobManager;
        }

        public Task Add(Cronjob cronjob)
        {
            _recurringJobManager.AddOrUpdate<HttpRequestJob>(
                cronjob.GetHangfireId(),
                job => job.SendRequestAsync(cronjob),
                cronjob.Cron.ToString(),
                TimeZoneInfo.Local
            );
            return Task.CompletedTask;
        }

        public Task Remove(Cronjob cronjob)
        {
            _recurringJobManager.RemoveIfExists(cronjob.GetHangfireId());
            return Task.CompletedTask;
        }
    }

    internal class HttpRequestJob
    {
        private readonly HttpClient _http;

        public HttpRequestJob(HttpClient http)
        {
            _http = http;
        }

        public async Task SendRequestAsync(Cronjob cronjob)
        {
            HttpMethod method = cronjob.HttpMethod.ToLowerInvariant() switch
            {
                "GET" => HttpMethod.Get,
                "POST" => HttpMethod.Post,
                _ => throw new ConstraintException("Unsupported HTTP method")
            };
            try
            {
                var req = new HttpRequestMessage(method, cronjob.Url);
                var response = await _http.SendAsync(req);
            }
            catch (Exception e)
            {
                // TODO: record new status update
                throw;
            }
        }
    }
}