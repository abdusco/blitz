using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Blitz.Web.Http;
using Blitz.Web.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blitz.Web.Auth
{
    [ApiExplorerSettings(IgnoreApi = true)]
    [Route("api/[controller]")]
    public class AuthController : ApiController
    {
        private readonly BlitzDbContext _dbContext;
        private readonly IJwtTokenIssuer _jwtTokenIssuer;

        public AuthController(BlitzDbContext dbContext,
                              IJwtTokenIssuer jwtTokenIssuer)
        {
            _dbContext = dbContext;
            _jwtTokenIssuer = jwtTokenIssuer;
        }

        [AllowAnonymous]
        [HttpGet("~/auth/login")]
        public Task<ActionResult> Login(string returnUrl)
        {
            return Task.FromResult<ActionResult>(Challenge(new AuthenticationProperties
            {
                RedirectUri = Url.Action(nameof(ExternalCallback), "Auth", new {returnUrl})
            }));
        }

        [HttpGet("~/auth/externalcallback")]
        public async Task<ActionResult> ExternalCallback(string returnUrl = "~/")
        {
            var result = await HttpContext.AuthenticateAsync(AppAuthenticationConstants.ExternalScheme);
            if (!result.Succeeded)
            {
                return RedirectToAction(nameof(Login));
            }

            return Url.IsLocalUrl(returnUrl) ? LocalRedirect(returnUrl) : Redirect(returnUrl);
        }

        [ApiExplorerSettings(IgnoreApi = false)]
        [Authorize]
        [HttpGet("me")]
        public Task<ActionResult> WhoAmI()
        {
            return Task.FromResult<ActionResult>(Ok(User.Claims.Select(c => new {c.Type, c.Value}).ToList()));
        }

        public record Token(string AccessToken);

        [ApiExplorerSettings(IgnoreApi = false)]
        [Authorize]
        [HttpPost("token")]
        public async Task<ActionResult> IssueToken()
        {
            var userId = new Guid(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var user = await _dbContext.Users
                .Include(e => e.Roles)
                .Include(e => e.Claims)
                .FirstOrDefaultAsync(e => e.Id == userId);
            if (user == null)
            {
                return NotFound(new ProblemDetails {Detail = "No such user"});
            }

            var identity = (ClaimsIdentity) User.Identity;
            identity!.AddClaims(user.Roles.Select(r => new Claim(ClaimTypes.Role, r.Name)));
            identity.AddClaims(
                user.Claims
                    .Where(c => c.ClaimType == AppClaimTypes.Project)
                    .Select(r => new Claim(AppClaimTypes.Project, r.ClaimValue))
            );

            var token = await _jwtTokenIssuer.IssueTokenAsync(User);
            return Ok(new Token(token.EncodeAsString()));
        }

        [HttpGet("~/auth/logout")]
        public async Task<ActionResult> Logout(string returnUrl = "~/")
        {
            await HttpContext.SignOutAsync(AppAuthenticationConstants.ApplicationScheme);
            await HttpContext.SignOutAsync(AppAuthenticationConstants.ExternalScheme);

            return Url.IsLocalUrl(returnUrl) ? LocalRedirect(returnUrl) : Redirect(returnUrl);
        }
    }
}