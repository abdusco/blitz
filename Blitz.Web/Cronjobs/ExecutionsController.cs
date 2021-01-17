using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Blitz.Web.Http;
using Blitz.Web.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blitz.Web.Cronjobs
{
    public class ExecutionsController : ApiController
    {
        private readonly BlitzDbContext _db;
        private readonly IMapper _mapper;

        public ExecutionsController(BlitzDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }


        [HttpGet("{id}")]
        public async Task<ActionResult<ExecutionDetailDto>> GetExecutionDetails(
            Guid id,
            int limit = 10,
            CancellationToken cancellationToken = default
        )
        {
            var existing = await _db.Executions.FirstOrDefaultAsync(
                e => e.Id == id, cancellationToken
            );
            if (existing is null)
            {
                return NotFound();
            }

            limit = Math.Clamp(limit, 0, 10);

            return await _db.Executions
                .Include(e => e.Cronjob)
                .ThenInclude(c => c.Project)
                .Include(e => e.Updates.OrderByDescending(u => u.CreatedAt).Take(limit))
                .ProjectTo<ExecutionDetailDto>(_mapper.ConfigurationProvider)
                .FirstOrDefaultAsync(cancellationToken);
        }


        [HttpPost("{id}/status")]
        public async Task<ActionResult> UpdateStatus(
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

            await using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);
            existing.UpdateStatus(status);
            await _db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return NoContent();
        }
    }

    [AutoMap(typeof(Execution))]
    public class ExecutionListDto
    {
        public Guid Id { get; set; }
        public Guid CronjobId { get; set; }
        public DateTime CreatedAt { get; set; }
        public string State { get; set; }
    }

    [AutoMap(typeof(Execution))]
    public class ExecutionDetailDto
    {
        public Guid Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public CronjobOverviewDto Cronjob { get; set; }
        public string State { get; set; }
        public List<ExecutionStatusListDto> Updates { get; set; }

        [AutoMap(typeof(Cronjob))]
        public class CronjobOverviewDto
        {
            public Guid Id { get; set; }
            public Guid ProjectId { get; set; }
            public string ProjectTitle { get; set; }
            public string Title { get; set; }
            public string Cron { get; set; }
            public string Url { get; set; }
            public string HttpMethod { get; set; }
        }
    }

    [AutoMap(typeof(ExecutionStatus))]
    public class ExecutionStatusListDto
    {
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