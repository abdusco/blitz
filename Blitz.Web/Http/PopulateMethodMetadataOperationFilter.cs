using System.Linq;
using Humanizer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Blitz.Web.Http
{
    public class PopulateMethodMetadataOperationFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            operation.Summary ??= context.MethodInfo.Name.Titleize();

            operation.Responses.Add("401", new OpenApiResponse {Description = "Unauthorized"});

            var appliedAuthPolicies = context.ApiDescription.ActionDescriptor.EndpointMetadata
                .OfType<AuthorizeAttribute>()
                .Where(a => a.Policy != null)
                .Select(a => a.Policy).ToList();
            if (appliedAuthPolicies.Any())
            {
                operation.Responses.Add("403", new OpenApiResponse {Description = "Forbidden"});
                operation.Description ??= $"<b>Authorized ({string.Join(", ", appliedAuthPolicies)})</b>";
            }
        }
    }
}