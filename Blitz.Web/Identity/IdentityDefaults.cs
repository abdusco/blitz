using System.Collections.Generic;
using AspNet.Security.OAuth.GitHub;

namespace Blitz.Web.Identity
{
    internal static class IdentityDefaults
    {
        public const string ExternalAuthenticationScheme = GitHubAuthenticationDefaults.AuthenticationScheme;
        public static List<Role> DefaultRoles = new List<Role>() {
            new Role("admin", "Admin"),
            new Role("pm", "Project Manager")
        };
    }
}