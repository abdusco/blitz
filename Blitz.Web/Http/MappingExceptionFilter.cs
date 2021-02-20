using System;
using System.Net;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;

namespace Blitz.Web.Http
{
    public class MappingExceptionFilter : IAsyncExceptionFilter
    {
        private ILogger _logger;

        public MappingExceptionFilter(ILoggerFactory loggerFactory)
        {
            _logger = loggerFactory.CreateLogger("ExceptionLogger");
        }

        public Task OnExceptionAsync(ExceptionContext context)
        {
            _logger.LogError(context.Exception, context.Exception.Message);
            context.Result = context.Exception switch
            {
                AutoMapperMappingException e => new BadRequestObjectResult(
                    new ProblemDetails {Title = "Mapping or parsing error", Detail = e.InnerException?.Message ?? e.Message}),
                ArgumentException e => new BadRequestObjectResult(new ProblemDetails {Title = "Invalid value", Detail = e.Message}),
                Exception e => new ObjectResult(new ProblemDetails
                {
                    Title = "Error",
                    Detail = "An error occured while processing the request", 
                    Status = StatusCodes.Status500InternalServerError
                })
            };

            return Task.CompletedTask;
        }
    }
}