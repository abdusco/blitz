using System;
using System.IdentityModel.Tokens.Jwt;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Blitz.Web.Hangfire
{
    public class TokenCacheOptions
    {
        public TimeSpan ClockSkew { get; set; } = TimeSpan.FromSeconds(15);
    }

    public class TokenCache
    {
        private readonly IMemoryCache _cache;
        private readonly TokenCacheOptions _options;
        private readonly ILogger<TokenCache> _logger;

        public TokenCache(IMemoryCache cache, ILogger<TokenCache> logger, IOptions<TokenCacheOptions> options)
        {
            _cache = cache;
            _logger = logger;
            _options = options.Value;
        }

        public async Task<string> GetOrCreateAsync(string key, Func<Task<string>> tokenFactory)
        {
            string jwt;
            if (_cache.TryGetValue(key, out jwt))
            {
                _logger.LogDebug("Cache hit: {Key}", key);
                return jwt;
            }

            _logger.LogDebug("Cache miss: {Key}", key);
            jwt = await tokenFactory();
            var token = new JwtSecurityToken(jwt);
            _cache.Set(key, jwt, token.ValidTo - _options.ClockSkew);
            return jwt;
        }
    }
}