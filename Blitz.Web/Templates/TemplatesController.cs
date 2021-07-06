using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Blitz.Web.Cronjobs;
using Blitz.Web.Http;
using Blitz.Web.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blitz.Web.Templates
{
    [AutoMap(typeof(ITokenAuth))]
    [AutoMap(typeof(TokenAuth), ReverseMap = true)]
    public record TokenAuthDto(string TokenEndpoint,
                               string Scope,
                               string ClientId,
                               string ClientSecret);

    [AutoMap(typeof(TokenAuth), ReverseMap = true)]
    public record TokenAuthCreateDto(string TokenEndpoint,
                                     string Scope,
                                     string ClientId,
                                     string ClientSecret);

    public class TemplatesController : ApiController
    {
        private readonly BlitzDbContext _dbContext;
        private readonly IMapper _mapper;

        public TemplatesController(BlitzDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        [AutoMap(typeof(ConfigTemplate), ReverseMap = true)]
        public record ConfigTemplateDto(Guid Id,
                                        string Key,
                                        string Title,
                                        TokenAuthDto Auth);


        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ConfigTemplateDto>> GetTemplateDetails(Guid id)
        {
            var template = await _dbContext.ConfigTemplates.FindAsync(id);
            return Ok(_mapper.Map<ConfigTemplateDto>(template));
        }

        [HttpGet]
        public async Task<ActionResult<List<ConfigTemplateDto>>> GetTemplateList(CancellationToken cancellationToken = default)
        {
            var templates = await _dbContext.ConfigTemplates.OrderBy(e => e.Title).ToListAsync(cancellationToken);
            return Ok(_mapper.Map<List<ConfigTemplateDto>>(templates));
        }

        [AutoMap(typeof(ConfigTemplate), ReverseMap = true)]
        public record ConfigTemplateCreateDto([Required] string Key, string Title, TokenAuthCreateDto Auth);


        [HttpPost]
        public async Task<IActionResult> CreateTemplate(ConfigTemplateCreateDto dto, CancellationToken cancellationToken = default)
        {
            var templateExists = await _dbContext.ConfigTemplates.AnyAsync(e => e.Key == dto.Key, cancellationToken);
            if (templateExists)
            {
                return BadRequest(new ProblemDetails { Detail = $"A template with key '{dto.Key}' already exists" });
            }

            var template = _mapper.Map<ConfigTemplate>(dto);
            await _dbContext.AddAsync(template, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return Ok();
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteTemplate(Guid id, CancellationToken cancellationToken = default)
        {
            var template = await _dbContext.ConfigTemplates.FindAsync(new object[] { id }, cancellationToken: cancellationToken);
            _dbContext.Remove(template);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return NoContent();
        }

        [HttpPatch("{id:guid}")]
        public async Task<IActionResult> UpdateTemplateDetails(Guid id, ConfigTemplateCreateDto dto, CancellationToken cancellationToken = default)
        {
            var record = await _dbContext.ConfigTemplates.FindAsync(new object[] { id }, cancellationToken: cancellationToken);
            _ = _mapper.Map(dto, record);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return NoContent();
        }
    }
}