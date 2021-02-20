using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Blitz.Web.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;

namespace Blitz.Web.Auth
{
    public class AuthorizationClaimsTransformer : IClaimsTransformation
    {
        private readonly UserManager<User> _userManager;

        public AuthorizationClaimsTransformer(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            if (principal.Identity is not ClaimsIdentity identity)
            {
                return principal;
            }

            var user = await _userManager.GetUserAsync(principal);
            if (user != null)
            {
                var roles = await _userManager.GetRolesAsync(user);
                identity.AddClaims(roles.Select(r => new Claim(ClaimTypes.Role, r)));
                var userClaims = await _userManager.GetClaimsAsync(user);
                identity.AddClaims(userClaims.Where(c => c.Type == AppClaimTypes.ProjectManager).ToArray());
            }

            return principal;
        }
    }
}