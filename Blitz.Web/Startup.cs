using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Blitz.Web.Auth;
using Blitz.Web.Cronjobs;
using Blitz.Web.Hangfire;
using Blitz.Web.Http;
using Blitz.Web.Identity;
using Blitz.Web.Maintenance;
using Blitz.Web.Persistence;
using Hangfire;
using Hangfire.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Net.Http.Headers;
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

            services.AddTransient<IdentitySeeder>();
            services.AddAutoMapper(typeof(Startup).Assembly);
            services.AddDbContext<BlitzDbContext>(ConfigureDbContext);

            services.AddRouting(o => o.LowercaseUrls = true);
            services.AddControllers(options => options.Filters.Add<MappingExceptionFilter>());
            services.AddSwaggerGen(
                options =>
                {
                    const string scope = "demo_api";
                    options.CustomOperationIds(e => $"{e.ActionDescriptor.RouteValues["action"]}");
                    options.SwaggerDoc("v1", new OpenApiInfo {Title = "Blitz", Version = "v1"});
                    options.OperationFilter<PopulateMethodMetadataOperationFilter>();
                    options.AddSecurityDefinition("oidc", new OpenApiSecurityScheme
                    {
                        Type = SecuritySchemeType.OAuth2,
                        In = ParameterLocation.Header,
                        Name = HeaderNames.Authorization,
                        Flows = new OpenApiOAuthFlows
                        {
                            AuthorizationCode = new OpenApiOAuthFlow
                            {
                                AuthorizationUrl = new Uri("https://devauth.thyteknik.com.tr/connect/authorize"),
                                TokenUrl = new Uri("https://devauth.thyteknik.com.tr/connect/token"),
                                Scopes = new Dictionary<string, string>
                                {
                                    [scope] = "read + write",
                                },
                            },
                        },
                    });
                    options.AddSecurityRequirement(new OpenApiSecurityRequirement
                    {
                        [new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "oidc",
                            },
                        }] = new[] {scope}
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
                .AddUserManager<AppUserManager>()
                .AddEntityFrameworkStores<BlitzDbContext>()
                .AddDefaultTokenProviders();
            services.ConfigureApplicationCookie(options =>
            {
                options.LoginPath = "/auth/login";
                options.LogoutPath = "/auth/logout";
                // options.ForwardDefaultSelector = context =>
                // {
                //     return context.Request.IsApiRequest()
                //         ? JwtBearerDefaults.AuthenticationScheme
                //         : IdentityConstants.ApplicationScheme;
                // };

                options.Events.OnRedirectToLogin = context =>
                {
                    if (context.Request.IsApiRequest())
                    {
                        context.Response.Headers[HeaderNames.Location] = context.RedirectUri;
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    }
                    else
                    {
                        context.Response.Redirect(context.RedirectUri, false, true);
                    }

                    return Task.CompletedTask;
                };
            });
            services.AddTransient<IExternalPrincipalTransformer, ThyExternalPrincipalTransformer>();
            services.AddAuthentication(options => { options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme; })
                .AddOpenIdConnect(o =>
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
                })
                .AddJwtBearer(options =>
                {
                    options.Authority = "https://devauth.thyteknik.com.tr";
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateAudience = false,
                    };
                    options.Events = new JwtBearerEvents
                    {
                        OnChallenge = context =>
                        {
                            if (context.Request.IsApiRequest())
                            {
                                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                            }

                            context.HandleResponse();
                            return Task.CompletedTask;
                        }
                    };
                });

            services.AddScoped<IAuthorizationHandler, ProjectManagerRequirement>();
            services.AddScoped<IClaimsTransformation, AuthorizationClaimsTransformer>();
            services.AddAuthorization(options =>
            {
                options.DefaultPolicy = new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .AddAuthenticationSchemes(
                        IdentityConstants.ApplicationScheme,
                        JwtBearerDefaults.AuthenticationScheme
                    )
                    .Build();

                options.AddPolicy(AuthorizationPolicies.RequireProjectManager, AuthorizationPolicies.RequireProjectManagerPolicy);
                options.AddPolicy(AuthorizationPolicies.RequireAdmin, AuthorizationPolicies.RequireAdminPolicy);
            });


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
                    c.DocumentTitle = "Blitz API";
                    c.DisplayOperationId();
                    c.RoutePrefix = "api";
                    c.SwaggerEndpoint("/openapi/v1.json", "Blitz API");
                    c.OAuthConfigObject.Scopes = new[] {"demo_api"};
                    c.OAuthConfigObject.ClientId = "demoapp";
                    c.OAuthUsePkce();
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

            // if (Environment.IsDevelopment())
            // {
            //     app.UseSpa(spa => { spa.UseProxyToSpaDevelopmentServer("http://localhost:5002"); });
            // }
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