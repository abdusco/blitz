using Blitz.Web.Cronjobs;
using Blitz.Web.Persistence;

namespace Blitz.Web.Presets
{
    public class ConfigTemplate : Entity
    {
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