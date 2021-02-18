using System.Threading;
using System.Threading.Tasks;
using Blitz.Web.Persistence;
using IdentityModel;
using Microsoft.AspNetCore.Identity;
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
            _logger.LogInformation("Creating default roles");
            await CreateDefaultRoles();
        }

        private async Task CreateDefaultRoles()
        {
            foreach (var role in IdentityDefaults.Stereotypes)
            {
                await _roleManager.CreateAsync(role);
            }
        }
    }
}