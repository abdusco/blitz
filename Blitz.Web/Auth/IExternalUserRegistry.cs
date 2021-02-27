using System.Security.Claims;
using System.Threading.Tasks;
using Blitz.Web.Persistence;

namespace Blitz.Web.Auth
{
    public interface IExternalUserRegistry
    {
        Task SaveExternalUserAsync(ClaimsPrincipal principal);
    }

    class ThyExternalUserRegistry : IExternalUserRegistry
    {
        private readonly BlitzDbContext _dbContext;

        public ThyExternalUserRegistry(BlitzDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public Task SaveExternalUserAsync(ClaimsPrincipal principal)
        {
            return Task.CompletedTask;
        }
    }
}