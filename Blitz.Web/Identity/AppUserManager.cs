using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Blitz.Web.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Blitz.Web.Identity
{
    public class AppUserManager : UserManager<User>
    {
        private readonly BlitzDbContext _context;

        public AppUserManager(
            BlitzDbContext context,
            IUserStore<User> store,
            IOptions<IdentityOptions> optionsAccessor,
            IPasswordHasher<User> passwordHasher,
            IEnumerable<IUserValidator<User>> userValidators,
            IEnumerable<IPasswordValidator<User>> passwordValidators,
            ILookupNormalizer keyNormalizer,
            IdentityErrorDescriber errors,
            IServiceProvider services,
            ILogger<UserManager<User>> logger)
            : base(store, optionsAccessor, passwordHasher, userValidators, passwordValidators, keyNormalizer, errors, services, logger)
        {
            _context = context;
        }

        public override async Task<IdentityResult> CreateAsync(User user)
        {
            var result = await base.CreateAsync(user);
            var isFirstUser = !(await _context.Users.AnyAsync(CancellationToken));
            if (result.Succeeded && isFirstUser)
            {
                Logger.LogInformation("User {Username} is the first registered user, granting it admin privileges", user.UserName);
                var roleResult = await AddToRoleAsync(user, IdentityDefaults.AdminRole);
                if (roleResult.Succeeded)
                {
                    Logger.LogInformation("User {Username} has been granted admin role");
                }
            }

            return result;
        }

        public async Task<User> GetUserAsync(string id)
        {
            return await Users.FirstOrDefaultAsync(e => e.Id == id, CancellationToken);
        }
    }
}