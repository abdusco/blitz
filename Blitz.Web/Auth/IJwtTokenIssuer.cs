using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Blitz.Web.Identity;
using IdentityModel;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Blitz.Web.Auth
{
    public interface IJwtTokenIssuer
    {
        Task<JwtSecurityToken> IssueTokenAsync(ClaimsPrincipal principal, params Claim[] additionalClaims);
    }

    class JwtOptions
    {
        public const string Key = "JwtToken";

        /// <summary>
        /// A cryptographically random string to sign JWT token
        /// </summary>
        /// <example>
        /// Generate one using python or openssl
        /// <code>
        /// python -c 'import secrets; print(secrets.token_hex(32))'
        /// openssl rand -hex 32
        /// </code>
        /// </example>
        public string SigningKey { get; set; }

        /// <summary>
        /// Token lifetime in minutes
        /// </summary>
        public long ExpirationMinutes { get; set; } = 120;

        public SigningCredentials SigningCredentials
            => new(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(SigningKey)), SecurityAlgorithms.HmacSha256Signature);
    }


    class JwtJwtTokenIssuer : IJwtTokenIssuer
    {
        private readonly IHostEnvironment _environment;
        private readonly JwtOptions _options;

        public JwtJwtTokenIssuer(IHostEnvironment environment, IOptions<JwtOptions> options)
        {
            _environment = environment;
            _options = options.Value;
        }

        public Task<JwtSecurityToken> IssueTokenAsync(ClaimsPrincipal principal, params Claim[] additionalClaims)
        {
            var jwtHandler = new JwtSecurityTokenHandler();

            // default claim mapping maps ClaimTypes.NameIdentifier to `nameid`, but we want `sub`
            jwtHandler.OutboundClaimTypeMap = new Dictionary<string, string>(JwtSecurityTokenHandler.DefaultOutboundClaimTypeMap)
            {
                [ClaimTypes.NameIdentifier] = JwtClaimTypes.Subject,
            };

            var accessToken = jwtHandler.CreateJwtSecurityToken(
                issuer: _environment.ApplicationName,
                audience: _environment.ApplicationName,
                subject: principal.Identities.First(),
                expires: DateTime.Now.AddMinutes(_options.ExpirationMinutes),
                signingCredentials: _options.SigningCredentials
            );


            return Task.FromResult(accessToken);
        }
    }

    internal static class JwtExtensions
    {
        public static string EncodeAsString(this JwtSecurityToken token)
            => new JwtSecurityTokenHandler().WriteToken(token);
    }
}