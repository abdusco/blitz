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
    public class CronjobsController : ApiController
    {
        private readonly BlitzDbContext _db;
        private readonly IMapper _mapper;
        private readonly ICronjobTriggerer _cronjobTriggerer;

        public CronjobsController(BlitzDbContext db, IMapper mapper, ICronjobTriggerer cronjobTriggerer)
        {
            _db = db;
            _mapper = mapper;
            _cronjobTriggerer = cronjobTriggerer;
        }

        [HttpGet]
        public async Task<ActionResult<List<CronjobDetailDto>>> ListAll(CancellationToken cancellationToken)
        {
            return await _db.Cronjobs
                .Include(c => c.Project)
                .Include(c => c.Executions.OrderByDescending(e => e.CreatedAt).Take(1))
                .OrderByDescending(p => p.CreatedAt)
                .ProjectTo<CronjobDetailDto>(_mapper.ConfigurationProvider)
                .ToListAsync(cancellationToken);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CronjobDetailDto>> GetCronjobDetails(Guid id, CancellationToken cancellationToken)
        {
            return await _db.Cronjobs
                .OrderByDescending(p => p.CreatedAt)
                .Include(c => c.Project)
                .Include(c => c.Executions.OrderByDescending(e => e.CreatedAt).Take(1))
                .ProjectTo<CronjobDetailDto>(_mapper.ConfigurationProvider)
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        }


        [HttpPatch("{id}")]
        public async Task<ActionResult> Update(Guid id, CronjobUpdateRequest request, CancellationToken cancellationToken)
        {
            var existing = await _db.Cronjobs.FirstOrDefaultAsync(
                e => e.Id == id, cancellationToken: cancellationToken
            );
            if (existing is null)
            {
                return NotFound();
            }

            // TODO: figure out how to ignore null members when mapping 
            existing.Enabled = request.Enabled ?? existing.Enabled;
            existing.Title = request.Title ?? existing.Title;
            existing.Cron = _mapper.Map<CronExpression>(request.Cron) ?? existing.Cron;

            await using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return NoContent();
        }

        [HttpPost]
        public async Task<ActionResult<CronjobDetailDto>> Create(
            CronjobCreateDto request,
            CancellationToken cancellationToken
        )
        {
            var c = _mapper.Map<Cronjob>(request);
            if (!await _db.Projects.AnyAsync(e => e.Id == request.ProjectId, cancellationToken))
            {
                return BadRequest();
            }

            await using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);
            await _db.AddAsync(c, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return _mapper.Map<CronjobDetailDto>(c);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(Guid id, CancellationToken cancellationToken)
        {
            var existing = await _db.Cronjobs.FirstOrDefaultAsync(
                e => e.Id == id, cancellationToken: cancellationToken
            );
            if (existing is null)
            {
                return NotFound();
            }

            await using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);
            _db.Remove(existing);
            await _db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return NoContent();
        }

        [HttpPost("{id}/trigger")]
        public async Task<ActionResult<Guid>> Trigger(Guid id, CancellationToken cancellationToken)
        {
            var existing = await _db.Cronjobs.FirstOrDefaultAsync(
                e => e.Id == id, cancellationToken: cancellationToken
            );
            if (existing is null)
            {
                return NotFound();
            }

            await using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);
            var execution = await existing.TriggerAsync(_cronjobTriggerer, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return Accepted(execution.Id);
        }

        [HttpGet("{id}/executions")]
        public async Task<ActionResult<List<ExecutionListDto>>> LatestExecutions(
            Guid id,
            int limit = 10,
            CancellationToken cancellationToken = default
        )
        {
            if (!await _db.Cronjobs.AnyAsync(c => c.Id == id, cancellationToken))
            {
                return NotFound();
            }

            limit = Math.Clamp(limit, 0, 50);

            return await _db.Executions
                .Where(e => e.CronjobId == id)
                .Include(e => e.Updates.OrderByDescending(u => u.CreatedAt).Take(1))
                .OrderByDescending(e => e.CreatedAt)
                .Take(limit)
                .ProjectTo<ExecutionListDto>(_mapper.ConfigurationProvider)
                .ToListAsync(cancellationToken);
        }
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
        public ExecutionOverviewDto LastExecution { get; set; }

        [AutoMap(typeof(Execution))]
        public class ExecutionOverviewDto
        {
            public DateTime CreatedAt { get; set; }
            public string State { get; set; }
        }
    }

    [AutoMap(typeof(Cronjob), ReverseMap = true)]
    public class CronjobCreateDto
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