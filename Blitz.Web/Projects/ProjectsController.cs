using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Blitz.Web.Auth;
using Blitz.Web.Cronjobs;
using Blitz.Web.Http;
using Blitz.Web.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blitz.Web.Projects
{
    [Authorize(Roles = "admin,pm")]
    public class ProjectsController : ApiController
    {
        private readonly BlitzDbContext _db;
        private readonly IMapper _mapper;

        public ProjectsController(BlitzDbContext db,
                                  IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<ActionResult<List<ProjectListDto>>> ListAllProjects(CancellationToken cancellationToken)
        {
            var projectGrants = User.GetClaimsOfType(AppClaimTypes.Project);
            return await _db.Projects
                .Where(p => User.IsInRole("admin") || projectGrants.Contains(p.Id.ToString()))
                .OrderBy(p => p.Title)
                .ProjectTo<ProjectListDto>(_mapper.ConfigurationProvider)
                .ToListAsync(cancellationToken);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProjectDetailsDto>> GetProjectDetails(Guid id, CancellationToken cancellationToken)
        {
            var project = await _db.Projects
                .Include(p => p.Cronjobs.OrderByDescending(c => c.CreatedAt))
                .SingleOrDefaultAsync(p => p.Id == id, cancellationToken);

            // OPTIMIZE: dont load everything before authorization
            // var result = await _authorizationService.AuthorizeAsync(User, project, AuthorizationPolicies.RequireProjectManagerPolicy);
            // if (!result.Succeeded)
            // {
            //     return Forbid();
            // }

            return _mapper.Map<ProjectDetailsDto>(project);
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> CreateProject(
            ProjectCreateDto request,
            CancellationToken cancellationToken
        )
        {
            var project = _mapper.Map<Project>(request);
            if (await _db.Projects.AnyAsync(r => r.Title == project.Title, cancellationToken))
            {
                return BadRequest();
            }

            await _db.AddAsync(project, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);

            return project.Id;
        }

        [Authorize(Roles = "admin")]
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteProject(Guid id, CancellationToken cancellationToken)
        {
            var existing = await _db.Projects.SingleOrDefaultAsync(
                p => p.Id == id, cancellationToken: cancellationToken
            );
            if (existing is null)
            {
                return NotFound();
            }

            _db.Remove(existing);
            await _db.SaveChangesAsync(cancellationToken);

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