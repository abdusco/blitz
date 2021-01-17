using System;
using System.Threading.Tasks;
using Blitz.Web.Cronjobs;
using Hangfire;

namespace Blitz.Web.Hangfire
{
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
                job => job.SendRequestAsync(cronjob.Id, default, default),
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

    internal static class CronjobExtensions
    {
        public static string GetHangfireId(this Cronjob cronjob) => $"{cronjob.Title}.{cronjob.Id}";
    }
}