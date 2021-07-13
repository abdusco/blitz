using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Blitz.Web.Auth;
using Blitz.Web.Cronjobs;
using Blitz.Web.Http;
using Blitz.Web.Identity;
using Blitz.Web.Persistence;
using Blitz.Web.Templates;
using Lib.AspNetCore.Auth.Intranet;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Blitz.Web.Projects
{
    [Authorize(Roles = "admin,pm")]
    public class ProjectsController : ApiController
    {
        private readonly BlitzDbContext _db;
        private readonly IMapper _mapper;
        private readonly ILogger<ProjectsController> _logger;
        private ICronjobRegistrationService _cronjobRegistrationService;

        public ProjectsController(BlitzDbContext db,
                                  IMapper mapper,
                                  ILogger<ProjectsController> logger,
                                  ICronjobRegistrationService cronjobRegistrationService)
        {
            _db = db;
            _mapper = mapper;
            _logger = logger;
            _cronjobRegistrationService = cronjobRegistrationService;
        }

        [AutoMap(typeof(Project))]
        public record ProjectListDto(Guid Id,
                                     string Title,
                                     int CronjobsCount);

        [HttpGet]
        public async Task<ActionResult<List<ProjectListDto>>> ListAllProjects(CancellationToken cancellationToken)
        {
            return await _db.Projects
                .FilterByClaims(User)
                .OrderBy(p => p.Title)
                .ProjectTo<ProjectListDto>(_mapper.ConfigurationProvider)
                .ToListAsync(cancellationToken);
        }

        [AutoMap(typeof(Project))]
        public record ProjectDto
        {
            public Guid Id { get; init; }
            public string Title { get; init; }
            public TokenAuthDto Auth { get; init; }
            public List<CronjobListDto> Cronjobs { get; init; }

            [AutoMap(typeof(Cronjob))]
            public record CronjobListDto(Guid Id,
                                         string Title,
                                         string Cron,
                                         bool Enabled);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProjectDto>> GetProjectDetails(Guid id, CancellationToken cancellationToken)
        {
            var project = await _db.Projects
                .Include(p => p.Cronjobs.OrderByDescending(c => c.CreatedAt))
                .SingleOrDefaultAsync(p => p.Id == id, cancellationToken);

            return _mapper.Map<ProjectDto>(project);
        }

        [AutoMap(typeof(Project), ReverseMap = true)]
        public record ProjectCreateDto(string Title);

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
            if (User.GetIdClaim() is string userId)
            {
                var user = await _db.Users.FirstOrDefaultAsync(e => e.Id == Guid.Parse(userId), cancellationToken);
                user.AddControlledEntity(project);
            }

            await _db.SaveChangesAsync(cancellationToken);

            return project.Id;
        }

        public record ProjectBatchCreateDto
        {
            [Required] public string Title { get; init; }
            public string Version { get; init; }
            public List<CronjobCreateDto> Cronjobs { get; init; } = new();
            public TokenAuthCreateDto Auth { get; set; }
            public string TemplateKey { get; set; }

            public record CronjobCreateDto([Required] string Title,
                                           string Description,
                                           [Required] string Cron,
                                           [Required] string Url,
                                           [Required] string HttpMethod);
        }

        [Authorize(AuthenticationSchemes = IntranetDefaults.AuthenticationScheme)]
        [HttpPost("batchcreate")]
        public async Task<ActionResult<Guid>> CreateProjectWithCronjobs(ProjectBatchCreateDto request, CancellationToken cancellationToken)
        {
            var project = await _db.Projects
                .Include(e => e.Cronjobs)
                .FirstOrDefaultAsync(e => e.Title == request.Title, cancellationToken: cancellationToken);

            if (project != null && project.Version == request.Version)
            {
                _logger.LogInformation("No changes in {ProjectTitle}", project.Title);
                return NoContent();
            }

            TokenAuth auth = null;
            ConfigTemplate template = null;
            if (request.TemplateKey != null)
            {
                template = await _db.ConfigTemplates.FirstOrDefaultAsync(e => e.Key == request.TemplateKey, cancellationToken);
            }

            if (request.Auth != null)
            {
                auth = _mapper.Map<TokenAuth>(request.Auth);
            }
            else if (template != null)
            {
                auth = template.Auth;
            }


            await using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);

            if (project == null)
            {
                project = new Project(request.Title) { Version = request.Version, Template = template, Auth = auth};
                await _db.AddAsync(project, cancellationToken);
            }
            else
            {
                _db.RemoveRange(project.Cronjobs);
                foreach (var cronjob in project.Cronjobs)
                {
                    await _cronjobRegistrationService.Remove(cronjob);
                }

                project.Cronjobs.Clear();
            }

            var updatedCronjobs = request.Cronjobs.Select(e => new Cronjob(project)
            {
                Title = e.Title,
                Description = e.Description,
                Cron = new CronExpression(e.Cron),
                Url = e.Url,
                HttpMethod = e.HttpMethod,
                IsAuthenticated = auth != null
            }).ToList();
            foreach (var cronjob in updatedCronjobs)
            {
                project.AddCronjob(cronjob);
            }

            await _db.SaveChangesAsync(cancellationToken);

            foreach (var cronjob in updatedCronjobs)
            {
                await _cronjobRegistrationService.Add(cronjob);
            }

            await tx.CommitAsync(cancellationToken);

            return NoContent();
        }

        [AutoMap(typeof(Project), ReverseMap = true)]
        public record ProjectUpdateDto(TokenAuthCreateDto Auth);

        [HttpPatch("{id:guid}")]
        public async Task<IActionResult> UpdateProjectDetails(Guid id, ProjectUpdateDto dto, CancellationToken cancellationToken)
        {
            var existing = await _db.Projects
                .SingleOrDefaultAsync(
                    p => p.Id == id, cancellationToken: cancellationToken
                );
            if (existing is null)
            {
                return NotFound();
            }

            _mapper.Map(dto, existing);
            await _db.SaveChangesAsync(cancellationToken);

            return NoContent();
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
}