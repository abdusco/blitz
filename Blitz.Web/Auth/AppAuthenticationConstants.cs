using Microsoft.AspNetCore.Authentication.OpenIdConnect;

namespace Blitz.Web.Auth
{
    internal static class AppAuthenticationConstants
    {
        public const string ApplicationScheme = "App";
        public const string ExternalScheme = OpenIdConnectDefaults.AuthenticationScheme;
    }
}