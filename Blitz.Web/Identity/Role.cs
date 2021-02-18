using Microsoft.AspNetCore.Identity;

namespace Blitz.Web.Identity
{
    public class Role : IdentityRole
    {
        public Role(string name, string title) : base(name)
        {
            Title = title;
        }
        public string Title { get; init; }
    }
}