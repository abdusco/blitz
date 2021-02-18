using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

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