using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Blitz.Web.Identity
{
    public class IdentitySeeder
    {
        private readonly RoleManager<Role> _roleManager;
        private readonly ILogger<IdentitySeeder> _logger;

        public IdentitySeeder(ILogger<IdentitySeeder> logger, RoleManager<Role> roleManager)
        {
            _logger = logger;
            _roleManager = roleManager;
        }

        public async Task SeedAsync(CancellationToken cancellationToken)
        {
            await CreateDefaultRoles();
        }

        private async Task CreateDefaultRoles()
        {
            _logger.LogInformation("Creating default roles");
            if (await _roleManager.Roles.AnyAsync())
            {
                _logger.LogDebug("Roles found in database, skipping seed");
                return;
            }
            foreach (var role in IdentityDefaults.Stereotypes)
            {
                await _roleManager.CreateAsync(role);
            }
        }
    }
}