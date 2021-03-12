using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Lib.AspNetCore.Auth.Intranet;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using NetTools;

namespace Blitz.Web.Auth
{
    internal static class AuthenticationBuilderExtensions
    {
        internal class OidcOptions
        {
            public const string Key = OpenIdConnectDefaults.AuthenticationScheme;
            public string Authority { get; set; }
            public string ClientId { get; set; }
            public string ClientSecret { get; set; }
            public List<string> Scopes { get; set; } = new List<string>();
            public string CallbackPath { get; init; } = "/-/auth/callback";
        }

        internal class IntranetAuthOptions
        {
            public const string Key = "Intranet";
            public List<string> AllowedNetworks { get; set; } = new();
            internal List<IPAddressRange> AllowedIpRanges => AllowedNetworks.Select(IPAddressRange.Parse).ToList();
        }

        public static AuthenticationBuilder AddThy(this AuthenticationBuilder builder, IConfiguration configuration)
        {
            var oidcOptions = configuration.GetSection(OidcOptions.Key).Get<OidcOptions>();
            builder.Services.Configure<OidcOptions>(configuration.GetSection(OidcOptions.Key));
            
            builder = builder
                .AddOpenIdConnect(AppAuthenticationConstants.ExternalScheme, "THY", o =>
                {
                    o.Authority = oidcOptions.Authority;
                    o.ClientId = oidcOptions.ClientId;
                    o.ClientSecret = oidcOptions.ClientSecret;
                    o.UsePkce = true;
                    o.CallbackPath = oidcOptions.CallbackPath;
                    o.RequireHttpsMetadata = false;
                    o.ResponseType = OpenIdConnectResponseType.Code;
                    o.GetClaimsFromUserInfoEndpoint = true;

                    foreach (var scope in oidcOptions.Scopes)
                    {
                        o.Scope.Add(scope);
                    }

                    o.ClaimActions.Clear();
                    o.ClaimActions.MapJsonKey(ClaimTypes.NameIdentifier, "sub");
                    o.ClaimActions.MapJsonKey(ClaimTypes.Email, "email");
                    o.ClaimActions.MapCustomJson(ClaimTypes.Name, json => $"{json.GetString("first_name")} {json.GetString("surname")}");

                    o.Events.OnTicketReceived = async context =>
                    {
                        var importer = context.HttpContext.RequestServices.GetRequiredService<IExternalUserImporter>();
                        context.Principal = await importer.ImportUserAsync(context.Principal, context.Scheme);
                    };
                    // populate authentication type in claimsidentity
                    o.TokenValidationParameters.AuthenticationType = AppAuthenticationConstants.ExternalScheme;
                });
            
            
            var intranetOptions = configuration.GetSection(IntranetAuthOptions.Key).Get<IntranetAuthOptions>();
            builder.Services.Configure<IntranetAuthOptions>(configuration.GetSection(IntranetAuthOptions.Key));

            if (intranetOptions != null)
            {
                builder = builder.AddIntranet(options =>
                {
                    options.AllowedIpRanges = intranetOptions.AllowedIpRanges;
                    options.Events.OnAuthenticated = context =>
                    {
                        // assign admin role
                        var identity = (ClaimsIdentity) context.Principal!.Identity;
                        identity!.AddClaim(new Claim(ClaimTypes.Role, "admin"));
                        return Task.CompletedTask;
                    };
                });
            }

            return builder;
        }
    }
}