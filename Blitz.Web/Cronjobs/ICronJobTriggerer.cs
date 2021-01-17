using System.Threading.Tasks;
using Hangfire;

namespace Blitz.Web.Cronjobs
{
    public interface ICronjobTriggerer
    {
        Task TriggerAsync(Cronjob cronjob);
    }

    public class HangfireCronjobTriggerer : ICronjobTriggerer
    {
        private readonly IRecurringJobManager _recurringJobManager;

        public HangfireCronjobTriggerer(IRecurringJobManager recurringJobManager)
        {
            _recurringJobManager = recurringJobManager;
        }

        public Task TriggerAsync(Cronjob cronjob)
        {
            _recurringJobManager.Trigger(cronjob.GetHangfireId());
            return Task.CompletedTask;
        }
    }
}