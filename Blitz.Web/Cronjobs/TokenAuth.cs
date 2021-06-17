namespace Blitz.Web.Cronjobs
{
    public record TokenAuth
    {
        public string TokenEndpoint { get; init; }
        public string Scope { get; init; }
        public string ClientId { get; init; }
        public string ClientSecret { get; init; }
    }
}