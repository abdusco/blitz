using Microsoft.AspNetCore.Authentication.OpenIdConnect;

namespace Blitz.Web.Auth
{
    internal static class AppAuthenticationDefaults
    {
        public const string AuthenticationScheme = OpenIdConnectDefaults.AuthenticationScheme;
    }
}