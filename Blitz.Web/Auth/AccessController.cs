using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Transactions;
using Ardalis.SmartEnum;
using Blitz.Web.Http;
using Blitz.Web.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blitz.Web.Auth
{
    [Authorize(Policy = AuthorizationPolicies.RequireAdmin)]
    public class AccessController : ApiController
    {
        private readonly AppUserManager _userManager;

        public AccessController(AppUserManager userManager)
        {
            _userManager = userManager;
        }

        public record Grant(string Resource, string Id, AccessType AccessType);

        [HttpGet("grants/{userId}")]
        public async Task<ActionResult<List<Grant>>> ListGrants(string userId)
        {
            var user = await _userManager.GetUserAsync(userId);
            var existingClaims = await _userManager.GetClaimsAsync(user);
            return Ok("123");
        }

        [HttpGet("roles/{userId}")]
        public async Task<ActionResult<IList<string>>> ListUserRoles(string userId)
        {
            var user = await _userManager.GetUserAsync(userId);
            var roles = await _userManager.GetRolesAsync(user);
            return Ok(roles);
        }

        public record UserRoleUpdateRequest(List<string> RoleNames);

        [HttpPut("roles/{userId}")]
        public async Task<ActionResult<IList<string>>> UpdateUserRoles(string userId, UserRoleUpdateRequest request)
        {
            using var tx = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);
            
            var user = await _userManager.GetUserAsync(userId);
            var roles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, roles.Except(request.RoleNames));
            await _userManager.AddToRolesAsync(user, request.RoleNames);
            
            tx.Complete();
            
            return NoContent();
        }
        
        public record ProjectAccessGrantRequest(List<string> ProjectIds);

        [HttpPut("grants/{userId}")]
        public async Task<IActionResult> UpdateProjectAccessGrants(string userId, ProjectAccessGrantRequest request)
        {
            using var tx = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);
            
            var user = await _userManager.GetUserAsync(userId);
            var existingClaims = await _userManager.GetClaimsAsync(user);

            var projectClaims = existingClaims.Where(c => c.Type == AppClaimTypes.ProjectManager).ToArray();
            await _userManager.RemoveClaimsAsync(user, projectClaims);

            var requestedClaims = request.ProjectIds
                .Select(pid => new Claim(AppClaimTypes.ProjectManager, pid.ToString()))
                .ToList();
            await _userManager.AddClaimsAsync(user, requestedClaims);
            
            tx.Complete();
            
            return NoContent();
        }
    }

    public class AccessType : SmartEnum<AccessType, string>
    {
        public AccessType(string name, string value) : base(name, value)
        {
        }

        public static AccessType Read = new AccessType(nameof(Read), nameof(Read).ToLowerInvariant());
        public static AccessType ReadWrite = new AccessType(nameof(ReadWrite), nameof(ReadWrite).ToLowerInvariant());
    }
}