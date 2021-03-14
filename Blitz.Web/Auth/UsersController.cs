using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Blitz.Web.Http;
using Blitz.Web.Identity;
using Blitz.Web.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blitz.Web.Auth
{
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
        public record UserListDto(Guid Id,
                                  string Name,
                                  string IdProvider,
                                  List<RoleListDto> Roles,
                                  List<UserClaimListDto> Claims);

        [AutoMap(typeof(Role), ReverseMap = true)]
        public record RoleListDto(Guid Id, string Name, string Title);

        [AutoMap(typeof(UserClaim), ReverseMap = true)]
        public record UserClaimListDto(Guid Id, string ClaimType, string ClaimValue);

        [Authorize(Roles = "admin")]
        [HttpGet]
        public async Task<ActionResult<List<UserListDto>>> ListAllUsers(CancellationToken cancellationToken)
        {
            var users = await _dbContext.Users
                .Include(e => e.Roles)
                .ToListAsync(cancellationToken);
            return Ok(_mapper.Map<List<UserListDto>>(users));
        }

        [Authorize(Roles = "admin")]
        [HttpGet("roles")]
        public async Task<ActionResult<List<RoleListDto>>> ListAllRoles()
        {
            var roles = await _dbContext.Roles.ToListAsync();
            return Ok(_mapper.Map<List<RoleListDto>>(roles));
        }

        public record UserRoleUpdateRequest(List<string> RoleNames);

        [Authorize(Roles = "admin")]
        [HttpPut("{userId:guid}/roles")]
        public async Task<IActionResult> UpdateUserRoles(Guid userId, UserRoleUpdateRequest request, CancellationToken cancellationToken)
        {
            var user = await _dbContext.Users
                .Include(e => e.Roles)
                .FirstOrDefaultAsync(e => e.Id == userId, cancellationToken: cancellationToken);
            if (user == null)
            {
                return NotFound(new ProblemDetails {Detail = "No such user"});
            }

            var otherAdminsPresent = await _dbContext.Users
                .Where(e => e.Id != user.Id)
                .AnyAsync(e => e.Roles.Any(r => r.Name == "admin"), cancellationToken);
            if (!request.RoleNames.Contains("admin") && !otherAdminsPresent)
            {
                return BadRequest(new ProblemDetails {Detail = "There must be at least one user with admin role"});
            }

            user.Roles.Clear();
            var requestedRoles = await _dbContext.Roles.Where(r => request.RoleNames.Contains(r.Name))
                .ToListAsync(cancellationToken: cancellationToken);
            foreach (var role in requestedRoles)
            {
                user.Roles.Add(role);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return NoContent();
        }

        [Authorize(Roles = "admin")]
        [HttpDelete("{userId:guid}")]
        public async Task<IActionResult> DeleteUser(Guid userId, CancellationToken cancellationToken)
        {
            var user = await _dbContext.Users
                .FirstOrDefaultAsync(e => e.Id == userId, cancellationToken: cancellationToken);
            if (user == null)
            {
                return NotFound(new ProblemDetails {Detail = "No such user"});
            }

            if (user.Id.ToString() == User.FindFirstValue(ClaimTypes.NameIdentifier))
            {
                return BadRequest(new ProblemDetails {Detail = "You cannot delete yourself"});
            }

            _dbContext.Remove(user);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return NoContent();
        }


        [AutoMap(typeof(User), ReverseMap = true)]
        public record UserDto(Guid Id,
                              string Name,
                              List<RoleListDto> Roles,
                              List<UserClaimListDto> Claims);

        [HttpGet("{userId:guid}")]
        public async Task<ActionResult<UserDto>> GetUserInfo(Guid userId)
        {
            var user = await _dbContext.Users
                .Include(e => e.Claims)
                .Include(e => e.Roles)
                .FirstOrDefaultAsync(e => e.Id == userId);
            if (user == null)
            {
                return NotFound(new ProblemDetails {Detail = "No such user"});
            }

            return Ok(_mapper.Map<UserDto>(user));
        }

        public record UserClaimsUpdateRequest(List<Guid> ProjectIds);

        [Authorize(Roles = "admin")]
        [HttpPut("{userId:guid}/claims")]
        public async Task<IActionResult> UpdateUserClaims(Guid userId, UserClaimsUpdateRequest updateRequest, CancellationToken cancellationToken)
        {
            var user = await _dbContext.Users
                .Include(e => e.Claims)
                .Include(e => e.Roles)
                .FirstOrDefaultAsync(e => e.Id == userId, cancellationToken: cancellationToken);
            if (user == null)
            {
                return NotFound(new ProblemDetails {Detail = "No such user"});
            }

            await using var tx = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
            var projects = await _dbContext.Projects.Where(e => updateRequest.ProjectIds.Contains(e.Id))
                .ToListAsync(cancellationToken: cancellationToken);
            _dbContext.RemoveRange(user.GetClaimsOfType(AppClaimTypes.Project));
            foreach (var item in projects)
            {
                user.AddControlledEntity(item);
            }

            if (projects.Any())
            {
                var pmRole = await _dbContext.Roles.FirstOrDefaultAsync(e => e.Name == "pm", cancellationToken);
                if (pmRole != null)
                {
                    user.AddRole(pmRole);
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);
            return NoContent();
        }
    }
}