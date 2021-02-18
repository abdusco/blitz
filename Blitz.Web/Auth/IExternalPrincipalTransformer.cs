using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;

namespace Blitz.Web.Auth
{
    public interface IExternalPrincipalTransformer
    {
        Task<ClaimsPrincipal> TransformAsync(UserInformationReceivedContext context);
    }

    class ThyExternalPrincipalTransformer : IExternalPrincipalTransformer
    {
        public Task<ClaimsPrincipal> TransformAsync(UserInformationReceivedContext context)
        {
            var firstName = context.User.RootElement.GetString("first_name");
            var lastName = context.User.RootElement.GetString("surname");
            var email = context.User.RootElement.GetString("email");
            var name = $"{firstName} {lastName}";

            return Task.FromResult(new ClaimsPrincipal(new ClaimsIdentity(
                new[]
                {
                    context.Principal.Claims.First(c => c.Type == ClaimTypes.NameIdentifier),
                    new Claim(ClaimTypes.Name, name),
                    new Claim(ClaimTypes.Email, email),
                },
                context.Principal.Identity.AuthenticationType)));
        }
    }
}