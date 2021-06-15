namespace Blitz.Web.Cronjobs
{
    public class TokenAuth
    {
        public string TokenEndpoint { get; set; }
        public string Scopes { get; set; }
        public string ClientId { get; set; }
        public string ClientSecret { get; set; }
    }
}