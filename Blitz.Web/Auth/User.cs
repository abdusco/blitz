using System.Collections.Generic;
using Blitz.Web.Persistence;

namespace Blitz.Web.Auth
{
    public class User : Entity
    {
        public string Email { get; set; }
        public ICollection<Role> Roles { get; set; } = new List<Role>();
    }

    public class Role : Entity
    {
        public string Title { get; set; }
    }
}