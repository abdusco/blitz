using System;
using System.Collections.Generic;
using Blitz.Web.Cronjobs;
using Blitz.Web.Identity;
using Blitz.Web.Persistence;
using Blitz.Web.Templates;

namespace Blitz.Web.Projects
{
    public class Project : Entity, IControlledEntity
    {
        private Project()
        {
        }

        public Project(string title)
        {
            Title = title ?? throw new ArgumentNullException(nameof(title));
        }

        public string Title { get; set; }
        public List<Cronjob> Cronjobs { get; set; } = new();

        /// <summary>
        /// Used to identify the latest version to ensure immutability of cronjobs that belong to a project
        /// </summary>
        public string Version { get; set; }

        public ConfigTemplate Template { get; set; }


        public TokenAuth Auth { get; set; }

        public UserClaim ToUserClaim(User user)
        {
            return new UserClaim(user, nameof(Project), Id.ToString());
        }

        public void AddCronjob(Cronjob cronjob)
        {
            cronjob.Project = this;
            Cronjobs.Add(cronjob);
        }
    }
}