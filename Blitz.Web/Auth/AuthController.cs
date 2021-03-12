using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Blitz.Web.Http;
using Blitz.Web.Persistence;
using Lib.AspNetCore.Auth.Intranet;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blitz.Web.Auth
{
    [Authorize(AuthenticationSchemes = IntranetDefaults.AuthenticationScheme)]
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
                RedirectUri = Url.ActionLink(nameof(ExternalCallback), "Auth", new {returnUrl})
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

        /// <summary>
        /// User claims grouped by identity source
        /// </summary>
        [ApiExplorerSettings(IgnoreApi = false)]
        [Authorize]
        [HttpGet("me")]
        public Task<ActionResult> WhoAmI()
        {
            return Task.FromResult<ActionResult>(Ok(
                User.Claims
                    .GroupBy(c => c.Subject.AuthenticationType)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(c => new {c.Type, c.Value}).ToList()
                    )
            ));
        }

        public record Token(string AccessToken);

        [ApiExplorerSettings(IgnoreApi = false)]
        [Authorize]
        [HttpPost("token")]
        public async Task<ActionResult> IssueToken()
        {
            var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(idClaim, out var userId))
            {
                return Unauthorized(new ProblemDetails {Detail = $"Cannot parse {idClaim} as a user id"});
            }

            var user = await _dbContext.Users
                .Include(e => e.Roles)
                .Include(e => e.Claims)
                .FirstOrDefaultAsync(e => e.Id == userId);
            if (user == null)
            {
                return NotFound(new ProblemDetails {Detail = "No such user"});
            }


            var identity = new ClaimsIdentity();
            identity.AddClaim(new Claim(ClaimTypes.Name, user.Name));
            identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()));
            identity.AddClaims(user.Roles.Select(r => new Claim(ClaimTypes.Role, r.Name)));
            identity.AddClaims(
                user.Claims.Select(c => new Claim(c.ClaimType, c.ClaimValue))
            );
            var principal = new ClaimsPrincipal(identity);
            var token = await _jwtTokenIssuer.IssueTokenAsync(principal);
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