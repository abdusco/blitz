using System.Threading;
using System.Threading.Tasks;
using Blitz.Web.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Blitz.Web.Identity
{
    public class IdentitySeeder
    {
        private readonly ILogger<IdentitySeeder> _logger;
        private readonly BlitzDbContext _dbContext;

        public IdentitySeeder(ILogger<IdentitySeeder> logger, BlitzDbContext dbContext)
        {
            _logger = logger;
            _dbContext = dbContext;
        }

        public async Task SeedAsync(CancellationToken cancellationToken)
        {
            await CreateDefaultRoles(cancellationToken);
        }

        private async Task CreateDefaultRoles(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Creating default roles");
            if (await _dbContext.Roles.AnyAsync(cancellationToken))
            {
                _logger.LogDebug("Roles found in database, skipping seed");
                return;
            }
            await _dbContext.Roles.AddRangeAsync(IdentityDefaults.DefaultRoles);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}