using System.Linq;
using Blitz.Web.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace Blitz.Web.Cronjobs
{
    internal static class ApplicationBuilderExtensions
    {
        public static IApplicationBuilder InitCronjobs(this IApplicationBuilder app)
        {
            using var scope = app.ApplicationServices.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<BlitzDbContext>();
            var registrationService = scope.ServiceProvider.GetRequiredService<ICronjobRegistrationService>();
            var cronjobs = dbContext.Cronjobs.Where(e => e.Enabled).ToList();

            foreach (var cronjob in cronjobs)
            {
                registrationService.Add(cronjob);
            }

            return app;
        }
    }
}