using System.Collections.Generic;

namespace Blitz.Web.Identity
{
    public class IdentityDefaults
    {
        public const string AdminRole = "admin";
        public const string ProjectManagerRole = "pm";
        
        public static IReadOnlyCollection<Role> Stereotypes = new List<Role>
        {
            new Role(AdminRole, "Administrator"),
            new Role(ProjectManagerRole, "Project Manager"),
        };
    }
}