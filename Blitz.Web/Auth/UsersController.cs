using System;
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
    public class UsersController : ApiController
    {
        private readonly AppUserManager _userManager;

        public UsersController(AppUserManager userManager)
        {
            _userManager = userManager;
        }

        [HttpGet("roles")]
        public async Task<ActionResult<IList<string>>> ListAllRoles()
        {
            var roles = await _userManager.GetRolesAsync();
            return Ok(roles);
        }

        [HttpGet("{userId}/roles")]
        public async Task<ActionResult<IList<string>>> ListUserRoles(Guid userId)
        {
            var user = await _userManager.GetUserAsync(userId);
            var roles = await _userManager.GetRolesAsync(user);
            return Ok(roles);
        }

        public record UserRoleUpdateRequest(List<string> RoleNames);

        [HttpPut("{userId}/roles")]
        public async Task<ActionResult<IList<string>>> UpdateUserRoles(Guid userId, UserRoleUpdateRequest request)
        {
            using var tx = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);

            var user = await _userManager.GetUserAsync(userId);
            var roles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, roles.Except(request.RoleNames));
            await _userManager.AddToRolesAsync(user, request.RoleNames);

            tx.Complete();

            return NoContent();
        }

        public record Grant(string Resource, string Id, AccessType AccessType);

        [HttpGet("{userId}/grants")]
        public async Task<ActionResult<List<Grant>>> ListUserGrants(Guid userId)
        {
            var user = await _userManager.GetUserAsync(userId);
            var existingClaims = await _userManager.GetClaimsAsync(user);
            return Ok("123");
        }

        public record GrantUpdateRequest(List<string> ProjectIds);

        [HttpPut("{userId}/grants")]
        public async Task<IActionResult> UpdateUserGrants(Guid userId, GrantUpdateRequest updateRequest)
        {
            using var tx = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);

            var user = await _userManager.GetUserAsync(userId);
            var existingClaims = await _userManager.GetClaimsAsync(user);

            var projectClaims = existingClaims.Where(c => c.Type == AppClaimTypes.ProjectManager).ToArray();
            await _userManager.RemoveClaimsAsync(user, projectClaims);

            var requestedClaims = updateRequest.ProjectIds
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