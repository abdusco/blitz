using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blitz.Web
{
    [Authorize]
    [Route("/home")]
    public class HomeController: Controller
    {
        [HttpGet("")]
        public async Task<IActionResult> Index()
        {
            return Ok($"home: {User?.Identity?.Name}");
        }
    }
}