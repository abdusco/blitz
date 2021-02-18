using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Blitz.Web.Auth;
using Blitz.Web.Cronjobs;
using Blitz.Web.Hangfire;
using Blitz.Web.Identity;
using Blitz.Web.Maintenance;
using Blitz.Web.Persistence;
using Hangfire;
using Hangfire.EntityFrameworkCore;
using IdentityModel;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.OpenApi.Models;
using Role = Blitz.Web.Identity.Role;
using User = Blitz.Web.Identity.User;

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
            services.AddTransient<IdentitySeeder>();
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
                    c.SwaggerDoc("v1", new OpenApiInfo {Title = "Blitz", Version = "v1"});
                    c.AddSecurityDefinition(CookieAuthenticationDefaults.AuthenticationScheme, new OpenApiSecurityScheme
                    {
                       Type = SecuritySchemeType.OpenIdConnect,
                       Flows = new OpenApiOAuthFlows
                       {
                           AuthorizationCode = new OpenApiOAuthFlow
                           {
                               AuthorizationUrl = new Uri("https://devauth.thyteknik.com.tr/connect/authorize"),
                               TokenUrl = new Uri("https://devauth.thyteknik.com.tr/connect/token"),
                               Scopes = new Dictionary<string, string>
                               {
                                   ["demo_api"] = "demo_api", 
                               },
                           }
                       }
                    });
                }
            );

            services.AddHangfire((provider, configuration) =>
                {
                    configuration.UseFilter(new AutomaticRetryAttribute {Attempts = 1});
                    configuration.UseEFCoreStorage(provider.GetRequiredService<BlitzDbContext>, new EFCoreStorageOptions());
                }
            );
            // services.AddHangfireServer(options => options.ServerName = Environment.ApplicationName);

            services.AddIdentity<User, Role>()
                .AddUserManager<UserManager>()
                .AddEntityFrameworkStores<BlitzDbContext>()
                .AddDefaultTokenProviders();
            
            services.AddTransient<IExternalPrincipalTransformer, ThyExternalPrincipalTransformer>();
            services.AddAuthentication()
                .AddOpenIdConnect( o =>
                {
                    o.Authority = "https://devauth.thyteknik.com.tr";
                    o.ClientId = "demoapp";
                    o.ClientSecret = "ed6fa02b-aee0-7d5a-1b04-848b13085a6f";
                    o.UsePkce = true;
                    o.CallbackPath = "/-/auth/callback";
                    o.RequireHttpsMetadata = false;
                    o.ResponseType = OpenIdConnectResponseType.Code;
                    o.GetClaimsFromUserInfoEndpoint = true;
                    
                    o.Scope.Add("openid");
                    
                    o.Events.OnUserInformationReceived = async context =>
                    {
                        var principalFactory = context.HttpContext.RequestServices.GetRequiredService<IExternalPrincipalTransformer>();
                        context.Principal = await principalFactory.TransformAsync(context);
                    };
                });
            // TODO: add jwt


            services.AddHttpContextAccessor();
            // services.AddSpaStaticFiles(options =>
            // {
            //     options.RootPath = "static";
            // });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, BlitzDbContext dbContext)
        {
            // app.SetupCronjobs();
            // app.UseGarbageCollector();

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseStaticFiles();

            // app.UseHttpsRedirection();
            app.UseRouting();
            app.UseAuthentication();
            app.UseAuthorization();
            
            app.UseSwaggerUI(
                c =>
                {
                    c.DisplayOperationId();
                    c.RoutePrefix = "api";
                    c.SwaggerEndpoint("/openapi/v1.json", "Blitz API");
                }
            );

            app.UseEndpoints(
                endpoints =>
                {
                    endpoints.MapSwagger("/openapi/{documentName}.json");
                    endpoints.MapControllers();

                    if (!Environment.IsDevelopment())
                    {
                        endpoints.MapFallbackToFile("index.html");
                    }
                }
            );

            if (Environment.IsDevelopment())
            {
                app.UseSpa(spa => { spa.UseProxyToSpaDevelopmentServer("http://localhost:5002"); });
            }
        }

        private void ConfigureDbContext(DbContextOptionsBuilder builder)
        {
            builder = builder
                .EnableDetailedErrors().EnableSensitiveDataLogging();

            if (Configuration.GetConnectionString("BlitzPostgres") is { } postgresDsn)
            {
                builder = builder.UseNpgsql(postgresDsn);
            }
            
            // else if (Configuration.GetConnectionString("BlitzSqlServer") is { } sqlServerDsn)
            // {
            //     builder = builder.UseSqlServer(sqlServerDsn);
            // }
            // else if (Configuration.GetConnectionString("BlitzSqlite") is { } sqliteDsn)
            // {
            //     builder = builder.UseSqlite(sqliteDsn);
            // }
        }
    }
}