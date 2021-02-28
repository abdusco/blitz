using System.Collections.Generic;
using System.Linq;
using Blitz.Web.Persistence;
using Blitz.Web.Projects;
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

        public void AddControlledEntity(IControlledEntity entity) {
            Claims.Add(entity.ToUserClaim(this));
        }

        public void RemoveClaimsOfType(string claimType) {
            foreach (var claim in Claims.Where(c => c.ClaimType == claimType))
            {
                Claims.Remove(claim);
            }
        }

    }
}