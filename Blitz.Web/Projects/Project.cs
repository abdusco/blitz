using System.Collections.Generic;
using Blitz.Web.Cronjobs;
using Blitz.Web.Identity;
using Blitz.Web.Persistence;

namespace Blitz.Web.Projects
{
    public class Project : Entity, IControlledEntity
    {
        public string Title { get; set; }
        public List<Cronjob> Cronjobs { get; set; } = new();

        public const string ClaimType = "project";

        public UserClaim ToUserClaim(User user)
        {
            return new UserClaim(user, ClaimType, Id.ToString());
        }
    }
}