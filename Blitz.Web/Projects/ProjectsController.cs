using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Blitz.Web.Cronjobs;
using Blitz.Web.Http;
using Blitz.Web.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blitz.Web.Projects
{
    public class ProjectsController : ApiController
    {
        private readonly BlitzDbContext _db;
        private readonly IMapper _mapper;

        public ProjectsController(BlitzDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<ActionResult<List<ProjectListDto>>> ListAll(CancellationToken cancellationToken)
        {
            return await _db.Projects
                .OrderBy(p => p.Title)
                .ProjectTo<ProjectListDto>(_mapper.ConfigurationProvider)
                .ToListAsync(cancellationToken);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProjectDetailsDto>> GetProjectDetails(Guid id, CancellationToken cancellationToken)
        {
            var result = await _db.Projects
                .Include(p => p.Cronjobs.OrderByDescending(c => c.CreatedAt))
                .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
            return _mapper.Map<ProjectDetailsDto>(result);
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create(
            ProjectCreateDto request,
            CancellationToken cancellationToken
        )
        {
            var p = _mapper.Map<Project>(request);
            if (await _db.Projects.AnyAsync(r => r.Title == p.Title, cancellationToken))
            {
                return BadRequest();
            }

            await using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);
            await _db.AddAsync(p, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return p.Id;
        }

        [HttpDelete]
        public async Task<ActionResult> Delete(Guid id, CancellationToken cancellationToken)
        {
            var existing = await _db.Projects.FirstOrDefaultAsync(
                p => p.Id == id, cancellationToken: cancellationToken
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
    }

    [AutoMap(typeof(Project))]
    public class ProjectListDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public int CronjobsCount { get; set; }
    }

    [AutoMap(typeof(Project))]
    public class ProjectDetailsDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public List<CronJobOverviewDto> Cronjobs { get; set; }


        [AutoMap(typeof(Cronjob))]
        public class CronJobOverviewDto
        {
            public Guid Id { get; set; }
            public string Title { get; set; }
            public string Cron { get; set; }
            public bool Enabled { get; set; }
        }
    }

    [AutoMap(typeof(Project), ReverseMap = true)]
    public class ProjectCreateDto
    {
        public string Title { get; set; }
    }
}