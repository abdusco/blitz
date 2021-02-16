using System;
using AspNet.Security.OAuth.GitHub;
using Blitz.Web.Auth;
using Blitz.Web.Cronjobs;
using Blitz.Web.Hangfire;
using Blitz.Web.Maintenance;
using Blitz.Web.Persistence;
using Hangfire;
using Hangfire.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;

namespace Blitz.Web
{
    public class Startup
    {
        public Startup(IConfiguration configuration, IHostEnvironment environment)
        {
            Configuration = configuration;
            Environment = environment;
        }

        public IConfiguration Configuration { get; }
        public IHostEnvironment Environment { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddTransient<ICronjobTriggerer, HangfireCronjobTriggerer>();
            services.AddTransient<ICronjobRegistrationService, HangfireCronjobRegistrationService>();
            services.AddGarbageCollector();
            services.AddHttpClient<HttpRequestJob>(
                (provider, client) => { client.Timeout = TimeSpan.FromSeconds(20); }
            );

            services.AddAutoMapper(typeof(Startup).Assembly);
            services.AddDbContext<BlitzDbContext>(ConfigureDbContext);
            services.AddRouting(o => o.LowercaseUrls = true);
            services.AddControllers();
            services.AddSwaggerGen(
                c =>
                {
                    c.CustomOperationIds(e => $"{e.ActionDescriptor.RouteValues["action"]}");
                    c.SwaggerDoc("v1", new OpenApiInfo {Title = "Blitz.Web", Version = "v1"});
                }
            );
            services.AddHangfire((provider, configuration) => 
                {
                    configuration.UseFilter(new AutomaticRetryAttribute {Attempts = 1});
                    configuration.UseEFCoreStorage(provider.GetRequiredService<BlitzDbContext>, new EFCoreStorageOptions());
                }
            );
            // services.AddHangfireServer(options => options.ServerName = Environment.ApplicationName);

            services.AddIdentityCore<User>(options => { })
                .AddUserStore<UserStore>()
                .AddRoles<Role>()
                .AddRoleStore<RoleStore>();

            // services.AddIdentity<>();
            services.AddRazorPages().AddRazorRuntimeCompilation();

            services.AddAuthentication(o =>
                {
                    o.RequireAuthenticatedSignIn = false;
                    o.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                    o.DefaultChallengeScheme = GitHubAuthenticationDefaults.AuthenticationScheme;
                })
                .AddCookie(o =>
                {
                    // o.Events = new CookieAuthenticationEvents
                    // {
                    //     OnValidatePrincipal = SecurityStampValidator.ValidatePrincipalAsync
                    // };
                    o.LoginPath = "/-/auth/login";
                    o.LogoutPath = "/-/auth/logout";
                    o.AccessDeniedPath = "/-/auth/forbidden";
                })
                .AddGitHub(o =>
                {
                    o.CallbackPath = "/-/auth/callback";
                    o.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                    o.ClientId = "b490f873d28551214a13";
                    o.ClientSecret = "86273860b68396ee266fd66788f7e8b49166fbc5";
                    o.SaveTokens = true;
                });

            services.AddHttpContextAccessor();
            services.AddTransient<IExternalSignInManager, TurkishTechnicExternalSignInManager>();
            services.AddHttpClient<TurkishTechnicExternalSignInManager>(client => client.Timeout = TimeSpan.FromSeconds(5));
        }

        private void ConfigureDbContext(DbContextOptionsBuilder builder)
        {
            builder = builder
                .EnableDetailedErrors().EnableSensitiveDataLogging();

            if (Configuration.GetConnectionString("BlitzPostgres") is { } postgresDsn)
            {
                builder = builder.UseNpgsql(postgresDsn);
            }
            else if (Configuration.GetConnectionString("BlitzSqlServer") is { } sqlServerDsn)
            {
                builder = builder.UseSqlServer(sqlServerDsn);
            }
            else if (Configuration.GetConnectionString("BlitzSqlite") is { } sqliteDsn)
            {
                builder = builder.UseSqlite(sqliteDsn);
            }
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, BlitzDbContext dbContext)
        {
            // dbContext.Database.EnsureDeleted();
            dbContext.Database.EnsureCreated();

            // app.SetupCronjobs();
            // app.UseGarbageCollector();

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseStaticFiles();

            app.UseSwagger(options => options.RouteTemplate = "/openapi/{documentName}.json");
            app.UseSwaggerUI(
                c =>
                {
                    c.DisplayOperationId();
                    c.RoutePrefix = "api";
                    c.SwaggerEndpoint("/openapi/v1.json", "Blitz.Web v1");
                }
            );
            // app.UseHttpsRedirection();
            app.UseRouting();
            app.UseAuthentication();
            app.UseAuthorization();
            app.UseEndpoints(
                endpoints =>
                {
                    endpoints.MapControllers();
                    endpoints.MapRazorPages();
                    endpoints.MapFallbackToFile("ui/index.html");
                }
            );
        }
    }
}