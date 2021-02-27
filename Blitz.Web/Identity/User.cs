using System.Collections.Generic;
using Blitz.Web.Persistence;
using Microsoft.AspNetCore.Identity;

namespace Blitz.Web.Identity
{
    public class User : Entity
    {
        public string Name { get; set; }
        public string Email { get; set; }

        public string IdProvider { get; set; }
        
        public string IdProviderSub { get; set; }

        /// <summary>
        /// Navigation property for the roles this user belongs to.
        /// </summary>
        public virtual ICollection<Role> Roles { get; } = new List<Role>();

        /// <summary>
        /// Navigation property for the claims this user possesses.
        /// </summary>
        public virtual ICollection<UserClaim> Claims { get; } = new List<UserClaim>();

    }
}