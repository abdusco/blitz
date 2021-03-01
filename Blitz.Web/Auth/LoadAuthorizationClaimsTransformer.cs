using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Blitz.Web.Identity;
using Blitz.Web.Persistence;
using Blitz.Web.Projects;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Blitz.Web.Auth
{
    public class LoadAuthorizationClaimsTransformer : IClaimsTransformation
    {
        private readonly BlitzDbContext _dbContext;
        private readonly ILogger<LoadAuthorizationClaimsTransformer> _logger;

        public LoadAuthorizationClaimsTransformer(BlitzDbContext dbContext, ILogger<LoadAuthorizationClaimsTransformer> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            var id = new Guid(principal.FindFirstValue(ClaimTypes.NameIdentifier));
            var user = await _dbContext.Users
                .Include(e => e.Roles)
                .Include(e => e.Claims)
                .FirstOrDefaultAsync(e => e.Id == id);
            if (user == null)
            {
                return principal;
            }

            _logger.LogInformation("Populating claims for the user {UserName}", user.Name);

            var identity = new ClaimsIdentity(principal.Identity.AuthenticationType);
            identity.AddClaims(principal.Claims);
            identity.AddClaims(user.Roles.Select(r => new Claim(ClaimTypes.Role, r.Name)));
            identity.AddClaims(
                user.Claims
                    .Where(c => c.ClaimType == AppClaimTypes.Project)
                    .Select(r => new Claim(AppClaimTypes.Project, r.ClaimValue))
            );

            return new ClaimsPrincipal(identity);
        }
    }
}