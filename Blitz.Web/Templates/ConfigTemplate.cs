using Blitz.Web.Cronjobs;
using Blitz.Web.Persistence;

namespace Blitz.Web.Templates
{
    public class ConfigTemplate : Entity
    {
        public string Key { get; set; }
        public string Title { get; set; }
        public TokenAuth Auth { get; set; }

        private ConfigTemplate()
        {
        }

        public ConfigTemplate(string title)
        {
            Title = title;
        }
    }
}