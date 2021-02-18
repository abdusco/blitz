using Microsoft.AspNetCore.Identity;

namespace Blitz.Web.Identity
{
    public class User: IdentityUser
    {
        public string Name { get; set; }
    }
}