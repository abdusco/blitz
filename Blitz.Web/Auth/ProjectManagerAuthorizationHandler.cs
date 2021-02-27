using System.Threading.Tasks;
using Blitz.Web.Cronjobs;
using Blitz.Web.Identity;
using Blitz.Web.Projects;
using Microsoft.AspNetCore.Authorization;

namespace Blitz.Web.Auth
{
    public class ProjectManagerRequirement : AuthorizationHandler<ProjectManagerRequirement>, IAuthorizationRequirement
    {
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, ProjectManagerRequirement requirement)
        {
            // allow admins by default
            /*if (context.User.IsInRole(IdentityDefaults.AdminRole))
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }*/
            
            var hasAccess = context.Resource switch
            {
                Project project when context.User.HasClaim(AppClaimTypes.ProjectManager, project.Id.ToString()) => true,
                Cronjob cronjob when context.User.HasClaim(AppClaimTypes.ProjectManager, cronjob.ProjectId.ToString()) => true,
                _ => false,
            };

            if (hasAccess)
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }
}