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
using Lib.AspNetCore.Auth.Intranet;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blitz.Web.Cronjobs
{
    [AllowAnonymous]
    public class ExecutionsController : ApiController
    {
        private readonly BlitzDbContext _db;
        private readonly IMapper _mapper;

        public ExecutionsController(BlitzDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<ActionResult<List<ExecutionListDto>>> ListLatestExecutions(
            int skip = 0,
            int limit = 30,
            CancellationToken cancellationToken = default
        )
        {
            limit = Math.Clamp(limit, 0, 50);
            var projectGrants = User.GetClaimsOfType(AppClaimTypes.Project);
            var results = await _db.Executions
                .Include(e => e.Cronjob)
                .ThenInclude(c => c.Project)
                // .Where(e => User.IsInRole("admin") || projectGrants.Contains(e.Cronjob.ProjectId.ToString()))
                .Include(e => e.Updates.OrderByDescending(u => u.CreatedAt).Take(1))
                .OrderByDescending(e => e.CreatedAt)
                .Take(limit)
                .ToListAsync(cancellationToken);
            return _mapper.Map<List<ExecutionListDto>>(results);
        }


        [HttpGet("{id}")]
        public async Task<ActionResult<ExecutionDetailDto>> GetExecutionDetails(
            Guid id,
            int limit = 10,
            CancellationToken cancellationToken = default
        )
        {
            var existing = await _db.Executions.SingleOrDefaultAsync(
                e => e.Id == id, cancellationToken
            );
            if (existing is null)
            {
                return NotFound();
            }

            limit = Math.Clamp(limit, 0, 10);

            var result = await _db.Executions
                .Include(e => e.Cronjob)
                .ThenInclude(c => c.Project)
                .Include(e => e.Updates.OrderByDescending(u => u.CreatedAt).Take(limit))
                .SingleOrDefaultAsync(e => e.Id == id, cancellationToken);
            return _mapper.Map<ExecutionDetailDto>(result);
        }


        [Authorize(AuthenticationSchemes = IntranetDefaults.AuthenticationScheme)]
        [HttpPost("{id:guid}/status")]
        public async Task<ActionResult> UpdateExecutionStatus(
            Guid id,
            ExecutionStatusCreateDto update,
            CancellationToken cancellationToken
        )
        {
            var existing = await _db.Executions.FirstOrDefaultAsync(
                e => e.Id == id, cancellationToken
            );
            if (existing is null)
            {
                return NotFound();
            }

            var status = _mapper.Map<ExecutionStatus>(update);

            existing.UpdateStatus(status);
            await _db.SaveChangesAsync(cancellationToken);
            return NoContent();
        }
    }

    [AutoMap(typeof(Execution))]
    public class ExecutionListDto
    {
        public Guid Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public CronjobOverviewDto Cronjob { get; set; }
        public string State { get; set; }
        public List<ExecutionStatusListDto> Updates { get; set; }
    }


    [AutoMap(typeof(Execution))]
    public class ExecutionDetailDto
    {
        public Guid Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public CronjobOverviewDto Cronjob { get; set; }
        public string State { get; set; }
        public List<ExecutionStatusListDto> Updates { get; set; }
    }

    [AutoMap(typeof(Cronjob))]
    public class CronjobOverviewDto
    {
        public Guid Id { get; set; }
        public Guid ProjectId { get; set; }
        public string ProjectTitle { get; set; }
        public string Title { get; set; }
    }

    [AutoMap(typeof(ExecutionStatus))]
    public class ExecutionStatusListDto
    {
        public Guid Id { get; set; }
        public string CreatedAt { get; set; }
        public string State { get; set; }
        public Dictionary<string, object> Details { get; set; }
    }

    [AutoMap(typeof(ExecutionStatus), ReverseMap = true)]
    public class ExecutionStatusCreateDto
    {
        public string State { get; set; }
        public Dictionary<string, object> Details { get; set; }
    }
}