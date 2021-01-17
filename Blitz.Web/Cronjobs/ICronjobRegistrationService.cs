using System.Threading.Tasks;

namespace Blitz.Web.Cronjobs
{
    public interface ICronjobRegistrationService
    {
        Task Add(Cronjob cronjob);
        Task Remove(Cronjob cronjob);
    }
}