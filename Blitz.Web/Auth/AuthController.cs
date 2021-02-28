using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Blitz.Web.Identity;
using Blitz.Web.Persistence;
using IdentityModel;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;

namespace Blitz.Web.Auth
{
    [ApiExplorerSettings(IgnoreApi = true)]
    public class AuthController : ControllerBase
    {
        private readonly BlitzDbContext _dbContext;

        public AuthController(BlitzDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [Authorize(AuthenticationSchemes = OpenIddictServerAspNetCoreDefaults.AuthenticationScheme)]
        [HttpGet("~/connect/userinfo")]
        [HttpPost("~/connect/userinfo")]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> UserInfo()
        {
            var idRequest = HttpContext.GetOpenIddictServerRequest() ?? throw new InvalidOperationException("OpenIdDict request cannot be retrieved");
            var info = await HttpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            var user = await _dbContext.Users
                .Include(e => e.Roles)
                .Include(e => e.Claims)
                .FirstOrDefaultAsync(e => e.Id == Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)));
            if (user is null)
            {
                return Challenge(
                    authenticationSchemes: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                    properties: new AuthenticationProperties(new Dictionary<string, string>
                    {
                        [OpenIddictServerAspNetCoreConstants.Properties.Error] = OpenIddictConstants.Errors.InvalidToken,
                        [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] =
                            "The specified access token is bound to an account that no longer exists."
                    }));
            }

            var claims = new Dictionary<string, object>(StringComparer.Ordinal)
            {
                [OpenIddictConstants.Claims.Subject] = user.Id.ToString()
            };

            if (User.HasScope(OpenIddictConstants.Scopes.Profile))
            {
                claims[OpenIddictConstants.Claims.Role] = user.Roles.Select(e => e.Name).ToList();
            }

            if (User.HasScope(OpenIddictConstants.Permissions.Scopes.Email))
            {
                // claims[OpenIddictConstants.Claims.Email] = await _userManager.GetEmailAsync(user);
                // claims[OpenIddictConstants.Claims.EmailVerified] = await _userManager.IsEmailConfirmedAsync(user);
            }

            if (User.HasScope(OpenIddictConstants.Permissions.Scopes.Phone))
            {
                // claims[OpenIddictConstants.Claims.PhoneNumber] = await _userManager.GetPhoneNumberAsync(user);
                // claims[OpenIddictConstants.Claims.PhoneNumberVerified] = await _userManager.IsPhoneNumberConfirmedAsync(user);
            }

            if (User.HasScope(OpenIddictConstants.Permissions.Scopes.Roles))
            {
                // claims[OpenIddictConstants.Claims.Role] = await _userManager.GetRolesAsync(user);
            }

            // Note: the complete list of standard claims supported by the OpenID Connect specification
            // can be found here: http://openid.net/specs/openid-connect-core-1_0.html#StandardClaims

            return Ok(claims);
        }
    }
    /*[Route("auth")]
    public class AuthController : ControllerBase
    {
        private readonly ILogger<AuthController> _logger;
        private readonly SignInManager<User> _signInManager;
        private readonly UserManager<User> _userManager;

        public AuthController(ILogger<AuthController> logger,
                              SignInManager<User> signInManager,
                              UserManager<User> userManager)
        {
            _logger = logger;
            _signInManager = signInManager;
            _userManager = userManager;
        }

        public record UserInfo(string Id, string Name, IList<string> Roles);

        [Authorize]
        [HttpGet("me")]
        public async Task<UserInfo> LoggedInUserInfo()
        {
            var user = await _userManager.GetUserAsync(User);
            var roles = await _userManager.GetRolesAsync(user);
            return new UserInfo(user.Id, user.Name, roles);
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        [HttpGet("logout")]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync();
            return Redirect("~/");
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        [AllowAnonymous]
        [HttpPost("login")]
        [HttpGet("login")]
        public Task<ActionResult> ExternalLogin(string returnUrl)
        {
            var provider = OpenIdConnectDefaults.AuthenticationScheme;
            var properties = _signInManager.ConfigureExternalAuthenticationProperties(
                provider,
                Url.Action(nameof(ExternalLoginCallback), new {returnUrl})
            );
            return Task.FromResult<ActionResult>(Challenge(properties, provider));
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        [AllowAnonymous]
        [HttpGet("externalcallback")]
        public async Task<IActionResult> ExternalLoginCallback(string returnUrl)
        {
            var info = await _signInManager.GetExternalLoginInfoAsync();
            if (info == null)
            {
                return RedirectToLocal("~/login");
            }

            _logger.LogDebug("Trying to log in {SubjectId}", info.ProviderKey);
            var extLoginResult = await _signInManager.ExternalLoginSignInAsync(info.LoginProvider, info.ProviderKey, isPersistent: false);
            if (extLoginResult.Succeeded)
            {
                // Update any authentication tokens if login succeeded
                await _signInManager.UpdateExternalAuthenticationTokensAsync(info);

                _logger.LogInformation(5, "User logged in with {Provider} provider.", info.LoginProvider);
                return RedirectToLocal(returnUrl);
            }

            _logger.LogInformation("Creating user record for {Email}", User.FindFirstValue(ClaimTypes.Email));
            var userRecord = new User
            {
                Id = info.ProviderKey,
                UserName = info.ProviderKey,
                Email = info.Principal.FindFirstValue(ClaimTypes.Email),
                Name = info.Principal.FindFirstValue(ClaimTypes.Name),
                EmailConfirmed = true
            };
            var creation = await _userManager.CreateAsync(userRecord);
            if (!creation.Succeeded)
            {
                RedirectToLocal("~/login");
            }

            var _ = await _userManager.AddLoginAsync(userRecord, info);
            await _signInManager.SignInAsync(userRecord, isPersistent: false);
            _logger.LogInformation(6, "User created an account using {Provider} provider.", info.LoginProvider);

            // Update any authentication tokens as well
            await _signInManager.UpdateExternalAuthenticationTokensAsync(info);
            return RedirectToLocal(returnUrl);
        }

        private IActionResult RedirectToLocal(string returnUrl)
        {
            if (Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }

            return LocalRedirect("~/");
        }
    }*/
}