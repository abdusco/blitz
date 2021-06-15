using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Blitz.Web.Cronjobs;
using Blitz.Web.Http;
using Blitz.Web.Persistence;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blitz.Web.Presets
{
    [AutoMap(typeof(TokenAuth), ReverseMap = true)]
    public record TokenAuthDto(string TokenEndpoint,
                               string Scopes,
                               string ClientId);

    [AutoMap(typeof(TokenAuth), ReverseMap = true)]
    public record TokenAuthCreateDto(string TokenEndpoint,
                                     string Scopes,
                                     string ClientId,
                                     string ClientSecret);

    [AutoMap(typeof(ConfigTemplate), ReverseMap = true)]
    public record ConfigTemplateDto(Guid Id, string Title, TokenAuthDto Auth);

    [AutoMap(typeof(ConfigTemplate), ReverseMap = true)]
    public record ConfigTemplateCreateDto(string Title, TokenAuthCreateDto Auth);

    public class PresetsController : ApiController
    {
        private readonly BlitzDbContext _dbContext;
        private readonly IMapper _mapper;

        public PresetsController(BlitzDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        [HttpGet("{id:guid}")]
        public async Task<ConfigTemplateDto> GetTemplateDetails(Guid id)
        {
            var template = await _dbContext.ConfigTemplates.FindAsync(id);
            return _mapper.Map<ConfigTemplateDto>(template);
        }

        [HttpGet]
        public async Task<List<ConfigTemplateDto>> GetTemplateList(CancellationToken cancellationToken = default)
        {
            var templates = await _dbContext.ConfigTemplates.OrderBy(e => e.Title).ToListAsync(cancellationToken);
            return _mapper.Map<List<ConfigTemplateDto>>(templates);
        }

        [HttpPost]
        public async Task<ConfigTemplateDto> CreateTemplate(ConfigTemplateCreateDto dto, CancellationToken cancellationToken = default)
        {
            var template = _mapper.Map<ConfigTemplate>(dto);
            await _dbContext.AddAsync(template, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return _mapper.Map<ConfigTemplateDto>(template);
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