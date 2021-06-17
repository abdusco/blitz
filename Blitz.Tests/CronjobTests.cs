using System;
using Blitz.Web.Cronjobs;
using Blitz.Web.Projects;
using Blitz.Web.Templates;
using Xunit;

namespace Blitz.Tests
{
    public class CronjobTests
    {
        [Fact]
        public void ConfigInheritance_CronjobHasNoAuthConfiguration()
        {
            var template = new ConfigTemplate("")
            {
                Auth = new TokenAuth
                {
                    Scope = "templatescope",
                    TokenEndpoint = "templateendpoint"
                }
            };
            
            var project = new Project("")
            {
                Template = template,
                Auth = new TokenAuth
                {
                    Scope = "projectscope",
                }
            };
            var cronjob = new Cronjob(project)
            {
            };
            
            Assert.Equal("projectscope", cronjob.EffectiveAuth.Scope);
            Assert.Equal("templateendpoint", cronjob.EffectiveAuth.TokenEndpoint);
        }
        
        [Fact]
        public void ConfigInheritance_CronjobOverridesEverythingElse()
        {
            var template = new ConfigTemplate("")
            {
                Auth = new TokenAuth
                {
                    Scope = "templatescope",
                    TokenEndpoint = "templateendpoint"
                }
            };
            
            var project = new Project("")
            {
                Template = template,
                Auth = new TokenAuth
                {
                    Scope = "projectscope",
                }
            };
            var cronjob = new Cronjob(project)
            {
                Auth = new TokenAuth
                {
                    Scope = "cronjobscope"
                }
            };
            
            Assert.Equal("cronjobscope", cronjob.EffectiveAuth.Scope);
            Assert.Equal("templateendpoint", cronjob.EffectiveAuth.TokenEndpoint);
        }
    }
}