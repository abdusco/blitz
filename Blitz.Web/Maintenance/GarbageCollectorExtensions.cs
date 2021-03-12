using System;
using Hangfire;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Blitz.Web.Maintenance
{
    internal static class GarbageCollectorExtensions
    {
        public static void AddGarbageCollector(this IServiceCollection serviceCollection, Action<GarbageCollectorOptions> configure = null)
        {
            var optionsBuilder = serviceCollection.AddOptions<GarbageCollectorOptions>()
                .BindConfiguration(nameof(GarbageCollector));
            if (configure is not null)
            {
                optionsBuilder.Configure(configure);
            }

            serviceCollection.AddTransient<GarbageCollector>();
        }

        public static void InitGarbageCollector(this IApplicationBuilder app)
        {
            var jobManager = app.ApplicationServices.GetRequiredService<IRecurringJobManager>();
            var options = app.ApplicationServices.GetRequiredService<IOptions<GarbageCollectorOptions>>().Value;
            var logger = app.ApplicationServices.GetRequiredService<ILoggerFactory>().CreateLogger(nameof(GarbageCollector));

            logger.LogInformation($"Registering a cronjob for garbage collection with cron={options.Schedule}");
            jobManager.RemoveIfExists(nameof(GarbageCollector));
            if (options.Enabled)
            {
                jobManager.AddOrUpdate<GarbageCollector>(nameof(GarbageCollector),
                    collector => collector.ExecuteAsync(default), () => options.Schedule);
            }
        }
    }
}