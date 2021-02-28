using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Blitz.Web.Http;
using Blitz.Web.Identity;
using Blitz.Web.Persistence;
using Blitz.Web.Projects;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blitz.Web.Auth
{
    // [Authorize(Policy = AuthorizationPolicies.RequireAdmin)]
    public class UsersController : ApiController
    {
        private readonly BlitzDbContext _dbContext;
        private readonly IMapper _mapper;

        public UsersController(BlitzDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        [AutoMap(typeof(User), ReverseMap = true)]
        public record UserListDto(Guid Id, string Name, string IdProvider, List<RoleListDto> Roles, List<UserClaimListDto> Claims);
        [AutoMap(typeof(Role), ReverseMap = true)]
        public record RoleListDto(Guid Id, string Name, string Title);
        [AutoMap(typeof(UserClaim), ReverseMap = true)]
        public record UserClaimListDto(Guid Id, string ClaimType, string ClaimValue);

        [HttpGet]
        public async Task<ActionResult<List<UserListDto>>> ListAllUsers(CancellationToken cancellationToken)
        {
            var users = await _dbContext.Users
                .Include(e => e.Roles)
                .ToListAsync(cancellationToken);
            return Ok(_mapper.Map<List<UserListDto>>(users));
        }

        [HttpGet("roles")]
        public async Task<ActionResult<List<RoleListDto>>> ListAllRoles()
        {
            var roles = await _dbContext.Roles.ToListAsync();
            return Ok(_mapper.Map<List<RoleListDto>>(roles));
        }

        public record UserRoleUpdateRequest(List<Guid> RoleIds);

        [HttpPut("{userId}/roles")]
        public async Task<ActionResult<IList<string>>> UpdateUserRoles(Guid userId, UserRoleUpdateRequest request)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(e => e.Id == userId);
            if (user == null)
            {
                return NotFound(new ProblemDetails { Detail = "No such user" });
            }
            var roles = await _dbContext.Roles.Where(r => request.RoleIds.Contains(r.Id)).ToListAsync();
            user.Roles.Clear();
            foreach (var role in roles)
            {
                user.Roles.Add(role);
            }
            await _dbContext.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("{userId}/claims")]
        public async Task<ActionResult<List<UserClaimListDto>>> ListUserClaims(Guid userId)
        {
            var claims = await _dbContext.UserClaims.Where(e => e.UserId == userId).ToListAsync();
            return Ok(_mapper.Map<List<UserClaimListDto>>(claims));
        }

        public record UserClaimsUpdateRequest(List<Guid> ProjectIds);

        [HttpPut("{userId}/claims")]
        public async Task<IActionResult> UpdateUserClaims(Guid userId, UserClaimsUpdateRequest updateRequest)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(e => e.Id == userId);
            if (user == null)
            {
                return NotFound(new ProblemDetails { Detail = "No such user" });
            } 

            var projects = await _dbContext.Projects.Where(e => updateRequest.ProjectIds.Contains(e.Id)).ToListAsync();
            user.RemoveClaimsOfType(Project.ClaimType);
            foreach (var item in projects)
            {
                user.AddControlledEntity(item);
            }

            await _dbContext.SaveChangesAsync();
            return NoContent();
        }
    }
}