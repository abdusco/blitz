using System;

namespace Blitz.Web.Identity
{
    public class UserClaim
    {
        public Guid Id { get; set; } = Guid.Empty;
        public Guid UserId { get; set; }
        public User User { get; set; }

        private UserClaim() {
            
        }

        public UserClaim(User user, string claimType, string claimValue)
        {
            User = user;
            ClaimType = claimType;
            ClaimValue = claimValue;
        }

        public string ClaimType { get; set; }
        public string ClaimValue { get; set; }
    }
}