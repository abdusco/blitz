using System;
using System.Threading.Tasks;

namespace Blitz.Web.Cronjobs
{
    public interface ICronjobTriggerer
    {
        Task TriggerAsync(Cronjob cronjob);
    }

    public class HangfireCronjobTriggerer: ICronjobTriggerer
    {
        public async Task TriggerAsync(Cronjob cronjob)
        {
            await Task.Delay(TimeSpan.FromSeconds(3));
        }
    }
}