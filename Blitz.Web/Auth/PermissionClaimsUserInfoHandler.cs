using System.Threading.Tasks;
using Blitz.Web.Persistence;
using OpenIddict.Server;

namespace Blitz.Web.Auth
{
    public class PermissionClaimsUserInfoHandler : IOpenIddictServerHandler<OpenIddictServerEvents.HandleUserinfoRequestContext>
    {
        private readonly BlitzDbContext _context;

        public PermissionClaimsUserInfoHandler(BlitzDbContext context)
        {
            _context = context;
        }

        public ValueTask HandleAsync(OpenIddictServerEvents.HandleUserinfoRequestContext context)
        {
            return ValueTask.CompletedTask;
        }
    }
}