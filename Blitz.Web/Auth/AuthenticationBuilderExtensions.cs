﻿using System.Collections.Generic;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;

namespace Blitz.Web.Auth
{
    internal static class AuthenticationBuilderExtensions
    {
        internal class OidcOptions
        {
            public const string Key = "Oidc";
            public string Authority { get; set; }
            public string ClientId { get; set; }
            public string ClientSecret { get; set; }
            public List<string> Scopes { get; set; } = new List<string>();
            public string CallbackPath { get; init; } = "/-/auth/callback";
        }

        public static AuthenticationBuilder AddThy(this AuthenticationBuilder builder, IConfiguration configuration)
        {
            var options = configuration.GetSection(OidcOptions.Key).Get<OidcOptions>();
            builder.Services.Configure<OidcOptions>(configuration.GetSection("OidcAuth"));

            return builder.AddOpenIdConnect(OpenIdConnectDefaults.AuthenticationScheme, "THY", o =>
            {
                o.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;

                o.Authority = options.Authority;
                o.ClientId = options.ClientId;
                o.ClientSecret = options.ClientSecret;
                o.UsePkce = true;
                o.CallbackPath = options.CallbackPath;
                o.RequireHttpsMetadata = false;
                o.ResponseType = OpenIdConnectResponseType.Code;
                o.GetClaimsFromUserInfoEndpoint = true;

                foreach (var scope in options.Scopes)
                {
                    o.Scope.Add(scope);
                }

                o.ClaimActions.MapAll();
                o.Events.OnTicketReceived = async context =>
                {
                    var importer = context.HttpContext.RequestServices.GetRequiredService<IExternalUserImporter>();
                    context.Principal = await importer.ImportUserAsync(context.Principal, context.Scheme);
                };
            });
        }
    }
}