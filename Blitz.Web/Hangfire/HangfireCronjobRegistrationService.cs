using System;
using System.Threading.Tasks;
using Blitz.Web.Cronjobs;
using Hangfire;
using Microsoft.Extensions.Logging;

namespace Blitz.Web.Hangfire
{
    public class HangfireCronjobRegistrationService : ICronjobRegistrationService
    {
        private readonly IRecurringJobManager _recurringJobManager;
        private readonly ILogger<HangfireCronjobRegistrationService> _logger;

        public HangfireCronjobRegistrationService(IRecurringJobManager recurringJobManager, ILogger<HangfireCronjobRegistrationService> logger)
        {
            _recurringJobManager = recurringJobManager;
            _logger = logger;
        }

        public Task Add(Cronjob cronjob)
        {
            _logger.LogInformation("Registering cronjob '{CronjobTitle}' ({CronjobId}) with Hangfire", cronjob.Title, cronjob.Id);
            _recurringJobManager.AddOrUpdate<HttpRequestJob>(
                cronjob.GetHangfireId(),
                job => job.SendRequestAsync(cronjob.Id, default, default),
                cronjob.Cron.ToString(),
                TimeZoneInfo.Local
            );
            return Task.CompletedTask;
        }

        public Task Remove(Cronjob cronjob)
        {
            _logger.LogInformation("Removing cronjob '{CronjobTitle}' ({CronjobId}) from Hangfire", cronjob.Title, cronjob.Id);
            _recurringJobManager.RemoveIfExists(cronjob.GetHangfireId());
            return Task.CompletedTask;
        }
    }

    internal static class CronjobExtensions
    {
        public static string GetHangfireId(this Cronjob cronjob) => $"{cronjob.Title}.{cronjob.Id}";
    }
}