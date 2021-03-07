using System.Collections.Generic;
using Blitz.Web.Cronjobs;
using Blitz.Web.Identity;
using Blitz.Web.Persistence;

namespace Blitz.Web.Projects
{
    public interface IControlledEntity
    {
        UserClaim ToUserClaim(User user);
    }

}