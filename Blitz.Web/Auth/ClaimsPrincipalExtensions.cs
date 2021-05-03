#nullable enable
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

        public static string? GetIdClaim(this ClaimsPrincipal principal)
        {
            return principal.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        }
    }
}