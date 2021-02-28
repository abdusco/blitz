using System.Security.Claims;
using System.Threading.Tasks;
using Blitz.Web.Identity;
using Blitz.Web.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;

namespace Blitz.Web.Auth
{
    public interface IExternalUserImporter
    {
        /// <summary>
        /// Imports a user, and returns a transformed <see cref="ClaimsPrincipal"/> that represents user's local identity
        /// </summary>
        /// <param name="principal"></param>
        /// <returns></returns>
        Task<ClaimsPrincipal> ImportUserAsync(ClaimsPrincipal principal, AuthenticationScheme authenticationScheme);
    }

    class ThyExternalUserImporter : IExternalUserImporter
    {
        private readonly BlitzDbContext _dbContext;

        public ThyExternalUserImporter(BlitzDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<ClaimsPrincipal> ImportUserAsync(ClaimsPrincipal principal, AuthenticationScheme authenticationScheme)
        {
            var user = await _dbContext.Set<User>().FirstOrDefaultAsync(e => e.IdProvider == authenticationScheme.Name
                                                                             && e.IdProviderSub ==
                                                                             principal.FindFirstValue(ClaimTypes.NameIdentifier));
            if (user != null)
            {
                user.Name = principal.FindFirstValue(ClaimTypes.Name);
                user.Email = principal.FindFirstValue(ClaimTypes.Email);
            }
            else
            {
                user = new User
                {
                    Name = principal.FindFirstValue(ClaimTypes.Name),
                    Email = principal.FindFirstValue(ClaimTypes.Email),
                    IdProvider = authenticationScheme.Name,
                    IdProviderSub = principal.FindFirstValue(ClaimTypes.NameIdentifier),
                };
                await _dbContext.AddAsync(user);
            }

            await _dbContext.SaveChangesAsync();

            var localIdentity = new ClaimsIdentity(principal.Identity.AuthenticationType);
            localIdentity.AddClaim(new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()));
            localIdentity.AddClaim(new Claim(ClaimTypes.Name, user.Name));
            return new ClaimsPrincipal(localIdentity);
        }
    }
    class GithubExternalUserImporter : IExternalUserImporter
    {
        private readonly BlitzDbContext _dbContext;

        public GithubExternalUserImporter(BlitzDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<ClaimsPrincipal> ImportUserAsync(ClaimsPrincipal principal, AuthenticationScheme authenticationScheme)
        {
            var user = await _dbContext.Set<User>().FirstOrDefaultAsync(e => e.IdProvider == authenticationScheme.Name
                                                                             && e.IdProviderSub ==
                                                                             principal.FindFirstValue(ClaimTypes.NameIdentifier));
            if (user != null)
            {
                user.Name = principal.FindFirstValue(ClaimTypes.Name);
                user.Email = principal.FindFirstValue(ClaimTypes.Email);
            }
            else
            {
                user = new User
                {
                    Name = principal.FindFirstValue(ClaimTypes.Name),
                    Email = principal.FindFirstValue(ClaimTypes.Email),
                    IdProvider = authenticationScheme.Name,
                    IdProviderSub = principal.FindFirstValue(ClaimTypes.NameIdentifier),
                };
                await _dbContext.AddAsync(user);
            }

            await _dbContext.SaveChangesAsync();

            var localIdentity = new ClaimsIdentity(principal.Identity.AuthenticationType);
            localIdentity.AddClaim(new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()));
            localIdentity.AddClaim(new Claim(ClaimTypes.Name, user.Name));
            return new ClaimsPrincipal(localIdentity);
        }
    }
}