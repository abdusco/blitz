using System;
using System.Threading.Tasks;
using Blitz.Web.Hangfire;
using Hangfire;

namespace Blitz.Web.Cronjobs
{
    public interface ICronjobTriggerer
    {
        Task<Guid> TriggerAsync(Cronjob cronjob);
    }

    public class HangfireCronjobTriggerer : ICronjobTriggerer
    {
        private readonly IBackgroundJobClient _backgroundJobClient;

        public HangfireCronjobTriggerer(IBackgroundJobClient backgroundJobClient)
        {
            _backgroundJobClient = backgroundJobClient;
        }

        public Task<Guid> TriggerAsync(Cronjob cronjob)
        {
            var id = Guid.NewGuid();
            _backgroundJobClient.Enqueue<HttpRequestJob>(job => job.SendRequestAsync(cronjob.Id, id, default));
            return Task.FromResult(id);
        }
    }
}