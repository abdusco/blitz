using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Blitz.Web.Auth;
using Blitz.Web.Http;
using Blitz.Web.Persistence;
using Blitz.Web.Projects;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blitz.Web.Cronjobs
{
    [Authorize(Roles = "admin,pm")]
    public class CronjobsController : ApiController
    {
        private readonly IAuthorizationService _authorizationService;
        private readonly ICronjobRegistrationService _cronjobRegistrationService;
        private readonly BlitzDbContext _db;
        private readonly IMapper _mapper;
        private readonly ICronjobTriggerer _cronjobTriggerer;

        public CronjobsController(
            BlitzDbContext db,
            IMapper mapper,
            ICronjobTriggerer cronjobTriggerer,
            ICronjobRegistrationService cronjobRegistrationService,
            IAuthorizationService authorizationService)
        {
            _db = db;
            _mapper = mapper;
            _cronjobTriggerer = cronjobTriggerer;
            _cronjobRegistrationService = cronjobRegistrationService;
            _authorizationService = authorizationService;
        }

        [HttpGet]
        public async Task<ActionResult<List<CronjobDetailDto>>> ListAllCronjobs(CancellationToken cancellationToken)
        {
            var projectGrants = User.GetClaimsOfType(AppClaimTypes.Project);
            var cronjobs = await _db.Cronjobs
                .Where(e => User.IsInRole("admin") || projectGrants.Contains(e.ProjectId.ToString()))
                .Include(c => c.Project)
                .Include(c => c.Executions.OrderByDescending(e => e.CreatedAt).Take(1))
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync(cancellationToken);
            return _mapper.Map<List<CronjobDetailDto>>(cronjobs);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CronjobDetailDto>> GetCronjobDetails(Guid id, CancellationToken cancellationToken)
        {
            var cronjob = await _db.Cronjobs
                .OrderByDescending(p => p.CreatedAt)
                .Include(c => c.Project)
                .Include(c => c.Executions.OrderByDescending(e => e.CreatedAt).Take(1))
                .SingleOrDefaultAsync(c => c.Id == id, cancellationToken);

            // OPTIMIZE: dont load everything before authorization
            // var result = await _authorizationService.AuthorizeAsync(User, cronjob, AuthorizationPolicies.RequireProjectManagerPolicy);
            // if (!result.Succeeded)
            // {
            //     return Forbid();
            // }

            return Ok(_mapper.Map<CronjobDetailDto>(cronjob));
        }


        [HttpPatch("{id}")]
        public async Task<ActionResult> UpdateCronjob(Guid id, CronjobUpdateRequest request, CancellationToken cancellationToken)
        {
            var cronjob = await _db.Cronjobs.SingleOrDefaultAsync(
                e => e.Id == id, cancellationToken: cancellationToken
            );
            if (cronjob is null)
            {
                return NotFound();
            }
            // OPTIMIZE: dont load everything before authorization
            // var result = await _authorizationService.AuthorizeAsync(User, cronjob, AuthorizationPolicies.RequireProjectManagerPolicy);
            // if (!result.Succeeded)
            // {
            //     return Forbid();
            // }

            // remove registered cronjobs that belongs to existing cronjob record
            // then update its details
            await _cronjobRegistrationService.Remove(cronjob);

            // TODO: figure out how to ignore null members when mapping 
            cronjob.Enabled = request.Enabled ?? cronjob.Enabled;
            cronjob.Title = request.Title ?? cronjob.Title;
            cronjob.Cron = _mapper.Map<CronExpression>(request.Cron) ?? cronjob.Cron;

            if (cronjob.Enabled)
            {
                await _cronjobRegistrationService.Add(cronjob);
            }

            await _db.SaveChangesAsync(cancellationToken);

            return NoContent();
        }

        // [Authorize(Roles = "pm")]
        [HttpPost]
        public async Task<ActionResult<CronjobDetailDto>> CreateCronjob(
            CronjobCreateRequest request,
            CancellationToken cancellationToken
        )
        {
            var cronjob = _mapper.Map<Cronjob>(request);
            if (!await _db.Projects.AnyAsync(e => e.Id == request.ProjectId, cancellationToken))
            {
                return BadRequest(new ProblemDetails {Detail = "No such project"});
            }

            var project = await _db.Projects.FindAsync(request.ProjectId);
            var result = await _authorizationService.AuthorizeAsync(User, project, AuthorizationPolicies.RequireProjectManagerPolicy);
            if (!result.Succeeded)
            {
                return Forbid();
            }

            await using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);
            await _db.AddAsync(cronjob, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            await _cronjobRegistrationService.Add(cronjob);
            await tx.CommitAsync(cancellationToken);

            return _mapper.Map<CronjobDetailDto>(cronjob);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteCronjob(Guid id, CancellationToken cancellationToken)
        {
            var cronjob = await _db.Cronjobs.SingleOrDefaultAsync(
                e => e.Id == id, cancellationToken: cancellationToken
            );
            if (cronjob is null)
            {
                return NotFound();
            }

            var result = await _authorizationService.AuthorizeAsync(User, cronjob, AuthorizationPolicies.RequireProjectManagerPolicy);
            if (!result.Succeeded)
            {
                return Forbid();
            }

            await using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);
            await _cronjobRegistrationService.Remove(cronjob);
            _db.Remove(cronjob);
            await _db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return NoContent();
        }

        [HttpPost("{id}/trigger")]
        public async Task<ActionResult<Guid>> TriggerCronjob(Guid id, CancellationToken cancellationToken)
        {
            var cronjob = await _db.Cronjobs.SingleOrDefaultAsync(
                e => e.Id == id, cancellationToken: cancellationToken
            );
            if (cronjob is null)
            {
                return NotFound();
            }

            // OPTIMIZE: dont load everything before authorization
            // var result = await _authorizationService.AuthorizeAsync(User, cronjob, AuthorizationPolicies.RequireProjectManagerPolicy);
            // if (!result.Succeeded)
            // {
            //     return Forbid();
            // }

            await using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);
            var execution = await cronjob.TriggerAsync(_cronjobTriggerer);
            await _db.AddAsync(execution, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return Accepted(execution.Id);
        }

        [HttpGet("{id}/executions")]
        public async Task<ActionResult<List<CronjobExecutionsListDto>>> LatestCronjobExecutions(
            Guid id,
            int limit = 10,
            CancellationToken cancellationToken = default
        )
        {
            var cronjob = await _db.Cronjobs.SingleOrDefaultAsync(c => c.Id == id, cancellationToken);
            if (cronjob == null)
            {
                return NotFound();
            }

            // OPTIMIZE: dont load everything before authorization
            // var result = await _authorizationService.AuthorizeAsync(User, cronjob, AuthorizationPolicies.RequireProjectManagerPolicy);
            // if (!result.Succeeded)
            // {
            //     return Forbid();
            // }

            limit = Math.Clamp(limit, 0, 50);

            return await _db.Executions
                .Where(e => e.CronjobId == id)
                .Include(e => e.Updates.OrderByDescending(u => u.CreatedAt).Take(1))
                .OrderByDescending(e => e.CreatedAt)
                .Take(limit)
                .ProjectTo<CronjobExecutionsListDto>(_mapper.ConfigurationProvider)
                .ToListAsync(cancellationToken);
        }

        [HttpDelete("{id}/executions")]
        public async Task<ActionResult<List<CronjobExecutionsListDto>>> ClearExecutions(
            Guid id,
            CancellationToken cancellationToken = default
        )
        {
            var cronjob = await _db.Cronjobs.SingleOrDefaultAsync(c => c.Id == id, cancellationToken);
            if (cronjob == null)
            {
                return NotFound();
            }

            // OPTIMIZE: dont load everything before authorization
            var result = await _authorizationService.AuthorizeAsync(User, cronjob, AuthorizationPolicies.RequireProjectManagerPolicy);
            if (!result.Succeeded)
            {
                return Forbid();
            }

            var removables = await _db.Executions.Where(e => e.CronjobId == id)
                .ToListAsync(cancellationToken);

            _db.RemoveRange(removables);
            await _db.SaveChangesAsync(cancellationToken);

            return NoContent();
        }
    }

    [AutoMap(typeof(Execution))]
    public class CronjobExecutionsListDto
    {
        public Guid Id { get; set; }
        public Guid CronjobId { get; set; }
        public DateTime CreatedAt { get; set; }
        public string State { get; set; }
    }


    [AutoMap(typeof(Cronjob))]
    public class CronjobDetailDto
    {
        public Guid Id { get; set; }
        public Guid ProjectId { get; set; }
        public string ProjectTitle { get; set; }
        public string Title { get; set; }
        public string Cron { get; set; }
        public string Url { get; set; }
        public string HttpMethod { get; set; }
        public bool Enabled { get; set; }
    }

    [AutoMap(typeof(Cronjob), ReverseMap = true)]
    public class CronjobCreateRequest
    {
        public Guid ProjectId { get; set; }
        public string Title { get; set; }
        public string Cron { get; set; }
        public string Url { get; set; }
        public string HttpMethod { get; set; }
    }

    [AutoMap(typeof(Cronjob), ReverseMap = true)]
    public class CronjobUpdateRequest
    {
        public string Title { get; set; }
        public string Cron { get; set; }
        public bool? Enabled { get; set; }
    }
}