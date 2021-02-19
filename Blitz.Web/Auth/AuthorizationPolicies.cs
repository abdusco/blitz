using System;
using System.Linq;
using Microsoft.AspNetCore.Authorization;

namespace Blitz.Web.Auth
{
    internal static class AuthorizationPolicies
    {
        public const string RequireAdmin = nameof(RequireAdmin);
        public const string RequireProjectManager = nameof(RequireProjectManager);

        public static AuthorizationPolicy RequireAdminPolicy => new AuthorizationPolicyBuilder()
            .RequireRole("admin")
            .Build();
        public static AuthorizationPolicy RequireProjectManagerPolicy => new AuthorizationPolicyBuilder()
            .AddRequirements(new ProjectManagerRequirement())
            .Build();
    }
}