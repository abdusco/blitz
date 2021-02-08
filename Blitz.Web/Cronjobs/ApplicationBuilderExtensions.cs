using Microsoft.AspNetCore.Builder;

namespace Blitz.Web.Cronjobs
{
    internal static class ApplicationBuilderExtensions
    {
        public static IApplicationBuilder SetupCronjobs(this IApplicationBuilder app)
        {
            // TODO: recreate cronjobs
            return app;
        }
    }
}