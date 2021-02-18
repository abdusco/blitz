using System.Security.Claims;
using System.Threading.Tasks;
using Blitz.Web.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Blitz.Web.Auth
{
    [ApiExplorerSettings(IgnoreApi = true)]
    [Route("auth")]
    public class AuthController : ControllerBase
    {
        private readonly ILogger<AuthController> _logger;
        private readonly SignInManager<User> _signInManager;
        private readonly IUserStore<User> _userStore;
        private readonly UserManager<User> _userManager;

        public AuthController(ILogger<AuthController> logger,
                              SignInManager<User> signInManager,
                              IUserStore<User> userStore,
                              UserManager<User> userManager)
        {
            _logger = logger;
            _signInManager = signInManager;
            _userStore = userStore;
            _userManager = userManager;
        }

        private const string Provider = "github";

        [HttpGet("logout")]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync();
            return Redirect("~/");
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> ExternalLogin(string returnUrl)
        {
            var provider = OpenIdConnectDefaults.AuthenticationScheme;
            var properties = _signInManager.ConfigureExternalAuthenticationProperties(
                provider,
                Url.Action(nameof(ExternalLoginCallback), new {returnUrl})
            );
            return Challenge(properties, provider);
        }

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

                _logger.LogInformation(5, "User logged in with {Name} provider.", info.LoginProvider);
                return RedirectToLocal(returnUrl);
            }

            _logger.LogInformation("Creating user record for {Email}", User.FindFirstValue(ClaimTypes.Email));
            var userRecord = new User
            {
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

            var loginResult = await _userManager.AddLoginAsync(userRecord, info);
            await _signInManager.SignInAsync(userRecord, isPersistent: false);
            _logger.LogInformation(6, "User created an account using {Name} provider.", info.LoginProvider);

            // Update any authentication tokens as well
            await _signInManager.UpdateExternalAuthenticationTokensAsync(info);
            return RedirectToLocal(returnUrl);
        }

        public record UserInfo(string Username, string Name, string Email);

        [Authorize]
        [HttpGet("me")]
        public async Task<UserInfo> LoggedInUserInfo()
        {
            var user = await _userManager.GetUserAsync(User);
            return new UserInfo(user.UserName, user.Name, user.Email);
        }

        private IActionResult RedirectToLocal(string returnUrl)
        {
            if (Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }

            return LocalRedirect("~/");
        }
    }
}