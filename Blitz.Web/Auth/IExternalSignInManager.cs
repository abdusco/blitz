using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace Blitz.Web.Auth
{
    public interface IExternalSignInManager
    {
        Task<ClaimsPrincipal> LoadExternalPrincipalAsync(string subjectId);
    }

    class TurkishTechnicExternalSignInManager : IExternalSignInManager
    {
        private readonly HttpClient _httpClient;

        public TurkishTechnicExternalSignInManager(IHttpContextAccessor http, HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<ClaimsPrincipal> LoadExternalPrincipalAsync(string subjectId)
        {
            var userInfo = await GetUserInfoAsync(subjectId);
            var principal = new ClaimsPrincipal(new ClaimsIdentity(
                new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userInfo.Email),
                    new Claim(ClaimTypes.Name, userInfo.Name),
                    new Claim(ClaimTypes.Email, userInfo.Email),
                }.Concat(userInfo.Roles.Select(r => new Claim(ClaimTypes.Role, r)))
            ));
            return principal;
        }

        private async Task<UserInfo> GetUserInfoAsync(string subjectId)
        {
            await Task.Delay(TimeSpan.FromSeconds(1));
            return new UserInfo
            {
                Email = "abdussametk@thy.com",
                Name = "Abdussamet Kocak",
                Roles = new() {"admin", "project.fym"}
            };
        }

        public record UserInfo
        {
            public string Name { get; init; }
            public string Email { get; init; }
            public List<string> Roles { get; set; }
        }
    }
}