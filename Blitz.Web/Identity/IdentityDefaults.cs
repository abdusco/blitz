using System.Collections.Generic;

namespace Blitz.Web.Identity
{
    internal static class IdentityDefaults
    {
        public static List<Role> DefaultRoles = new List<Role>()
        {
            new Role("admin", "Admin"),
            new Role("pm", "Project Manager")
        };
    }
}