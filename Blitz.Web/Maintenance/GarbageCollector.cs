using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Blitz.Web.Persistence;
using Hangfire;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Blitz.Web.Maintenance
{
    internal class GarbageCollectorOptions
    {
        public string Schedule { get; set; } = "*/5 * * * *";
        public int MinAgeMinutes { get; set; } = 360;
        public int MinKeptRecentExecutions { get; set; } = 15;
        public bool Enabled { get; set; } = true;
    }

    internal class GarbageCollector
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<GarbageCollector> _logger;
        private readonly GarbageCollectorOptions _options;

        public GarbageCollector(IServiceScopeFactory scopeFactory,
                                IOptionsSnapshot<GarbageCollectorOptions> options,
                                ILogger<GarbageCollector> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _options = options.Value;
        }

        public async Task ExecuteAsync(CancellationToken cancellationToken = default)
        {
            using var scope = _scopeFactory.CreateScope();
            await using var db = scope.ServiceProvider.GetRequiredService<BlitzDbContext>();

            _logger.LogInformation($"Running cleanup");
            var cutoff = DateTime.UtcNow - TimeSpan.FromMinutes(_options.MinAgeMinutes);

            var executedCronjobIds = db.Executions
                .Where(e => e.CreatedAt < cutoff)
                .Select(e => e.CronjobId)
                .Distinct()
                .ToList();

            if (!executedCronjobIds.Any())
            {
                _logger.LogInformation("Nothing to do. Skipping cleanup");
                return;
            }

            foreach (var cronjobId in executedCronjobIds)
            {
                _logger.LogInformation("Cleaning old executions for cronjobId={CronjobId}", cronjobId);
                db.RemoveRange(db.Executions
                    .OrderByDescending(e => e.CreatedAt)
                    .Where(e => e.CronjobId == cronjobId && e.CreatedAt < cutoff)
                    .Skip(_options.MinKeptRecentExecutions));
            }

            await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);
        }
    }
}