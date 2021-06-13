using System.IdentityModel.Tokens.Jwt;
using IdentityModel;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Net.Http.Headers;
using JwtConstants = Microsoft.IdentityModel.JsonWebTokens.JwtConstants;

namespace Blitz.Web.Cronjobs
{
    public class TokenAuth
    {
        public string TokenEndpoint { get; set; }
        public string Scopes { get; set; }
        public string ClientId { get; set; }
        public string ClientSecret { get; set; }
        public string GrantType { get; set; }
        public string Header { get; set; } = "Authorization";
        public string AuthScheme { get; set; } = "Bearer";
    }
}