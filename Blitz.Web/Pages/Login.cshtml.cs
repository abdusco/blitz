using System.Threading.Tasks;
using Blitz.Web.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;

namespace Blitz.Web.Pages
{
    [AllowAnonymous]
    public class Login : PageModel
    {
        private readonly IExternalSignInManager _externalSignInManager;
        private readonly ILogger<Login> _logger;

        public Login(IExternalSignInManager externalSignInManager, ILogger<Login> logger)
        {
            _externalSignInManager = externalSignInManager;
            _logger = logger;
        }

        [BindProperty] public string ReturnUrl { get; set; }
        [BindProperty] public string ExternalErrorMessage { get; set; }


        public async Task<IActionResult> OnGetAsync(string returnUrl = null)
        {
            ReturnUrl = returnUrl;
            return Page();
        }

        public async Task<IActionResult> OnPostExternalLoginAsync(string returnUrl = null)
        {
            return new ChallengeResult(new AuthenticationProperties
            {
                RedirectUri = Url.Page(nameof(Login), "callback", new
                {
                    ReturnUrl = returnUrl
                }),
            });
        }

        public async Task<IActionResult> OnGetCallback(string returnUrl = null)
        {
            var subjectId = User?.Identity?.Name;
            if (subjectId == null)
            {
                ExternalErrorMessage = "Cannot retrieve user information";
                return Page();
            }
            
            var principal = await _externalSignInManager.LoadExternalPrincipalAsync(subjectId);
            await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal, new AuthenticationProperties());
            
            return RedirectToLocal(returnUrl);
        }

        private IActionResult RedirectToLocal(string returnUrl) 
            => Redirect(Url.IsLocalUrl(returnUrl) ? returnUrl : "~/home");
    }
}