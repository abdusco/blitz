﻿using System.Security.Claims;
using System.Threading.Tasks;
using Blitz.Web.Identity;
using Blitz.Web.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Blitz.Web.Auth
{
    public interface IExternalUserImporter
    {
        /// <summary>
        /// Imports a user, and returns a transformed <see cref="ClaimsPrincipal"/> that represents user's local identity
        /// </summary>
        /// <param name="principal"></param>
        /// <param name="authenticationScheme"></param>
        /// <returns></returns>
        Task<ClaimsPrincipal> ImportUserAsync(ClaimsPrincipal principal, AuthenticationScheme authenticationScheme);
    }

    class ThyExternalUserImporter : IExternalUserImporter
    {
        private readonly BlitzDbContext _dbContext;
        private readonly ILogger<ThyExternalUserImporter> _logger;

        public ThyExternalUserImporter(BlitzDbContext dbContext, ILogger<ThyExternalUserImporter> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        public async Task<ClaimsPrincipal> ImportUserAsync(ClaimsPrincipal principal, AuthenticationScheme authenticationScheme)
        {
            var authScheme = authenticationScheme.DisplayName ?? authenticationScheme.Name;

            var user = await _dbContext.Set<User>().FirstOrDefaultAsync(e => e.IdProvider == authScheme
                                                                             && e.IdProviderSub ==
                                                                             principal.FindFirstValue(ClaimTypes.NameIdentifier));
            if (user != null)
            {
                _logger.LogInformation("Updating details of {UserName}", user.Name);
                user.Name = principal.FindFirstValue(ClaimTypes.Name);
                user.Email = principal.FindFirstValue(ClaimTypes.Email);
            }
            else
            {
                user = new User
                {
                    Name = principal.FindFirstValue(ClaimTypes.Name),
                    Email = principal.FindFirstValue(ClaimTypes.Email),
                    IdProvider = authScheme,
                    IdProviderSub = principal.FindFirstValue(ClaimTypes.NameIdentifier),
                };

                var isFirstUser = !await _dbContext.Users.AnyAsync();
                if (isFirstUser)
                {
                    _logger.LogInformation("{User} is the first registered user, promoting to admin role", user);
                    var adminRole = await _dbContext.Roles.FirstOrDefaultAsync(r => r.Name == "admin");
                    user.Roles.Add(adminRole);
                }

                await _dbContext.AddAsync(user);
            }

            await _dbContext.SaveChangesAsync();

            var localIdentity = new ClaimsIdentity(principal.Identity!.AuthenticationType);
            localIdentity.AddClaim(new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()));
            localIdentity.AddClaim(new Claim(ClaimTypes.Name, user.Name));
            return new ClaimsPrincipal(localIdentity);
        }
    }
}