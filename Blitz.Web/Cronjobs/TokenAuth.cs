using System;
using System.Collections.Generic;
using System.Linq;
using Blitz.Web.Presets;

namespace Blitz.Web.Cronjobs
{
    public interface ITokenAuth
    {
        string TokenEndpoint { get; }
        string Scope { get; }
        string ClientId { get; }
        string ClientSecret { get; }
    }

    public record TokenAuth : ITokenAuth
    {
        public string TokenEndpoint { get; init; }
        public string Scope { get; init; }
        public string ClientId { get; init; }
        public string ClientSecret { get; init; }
    }

    public class CombinedTokenAuth : ITokenAuth
    {
        private List<ITokenAuth> _sources;

        public CombinedTokenAuth(ICollection<ITokenAuth> sources)
        {
            if (sources is { Count: <1 })
            {
                throw new ArgumentException("Sources cannot be empty", nameof(sources));
            }

            _sources = sources.ToList();
        }

        public string TokenEndpoint => _sources.Select(e => e?.TokenEndpoint).FirstOrDefault(it => it != null);
        public string Scope => _sources.Select(e => e?.Scope).FirstOrDefault(it => it != null);
        public string ClientId => _sources.Select(e => e?.ClientId).FirstOrDefault(it => it != null);
        public string ClientSecret => _sources.Select(e => e?.ClientSecret).FirstOrDefault(it => it != null);
    }
}