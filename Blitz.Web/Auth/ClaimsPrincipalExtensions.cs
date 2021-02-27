using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using Blitz.Web.Identity;

namespace Blitz.Web.Auth
{
    internal static class ClaimsPrincipalExtensions
    {
        public static IReadOnlyList<string> GetClaimsOfType(this ClaimsPrincipal principal, string claimType)
        {
            return principal.Claims.Where(c => c.Type == claimType).Select(c => c.Value).ToList().AsReadOnly();
        }
        public static bool IsAdmin(this ClaimsPrincipal principal)
        {
            return principal.IsInRole(IdentityDefaults.AdminRole);
        }
        
    }
}