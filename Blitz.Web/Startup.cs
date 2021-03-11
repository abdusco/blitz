using System;
using System.Collections.Generic;
using System.Net;
using System.Security.Claims;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.Json;
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
using IdentityModel;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.OAuth.Claims;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Net.Http.Headers;
using Microsoft.OpenApi.Models;
using OpenIddict.Abstractions;
using OpenIddict.Server;

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
            services.AddHangfire((provider, configuration) =>
                {
                    configuration.UseFilter(new AutomaticRetryAttribute {Attempts = 1});
                    configuration.UseInMemoryStorage();
                    // configuration.UseEFCoreStorage(() => provider.CreateScope().ServiceProvider.GetRequiredService<BlitzDbContext>(),
                    //     new EFCoreStorageOptions());
                }
            );
            services.AddHangfireServer(options => options.ServerName = Environment.ApplicationName);
            services.AddGarbageCollector();
            services.AddHttpClient<HttpRequestJob>(
                (provider, client) => { client.Timeout = TimeSpan.FromSeconds(20); }
            );

            services.AddAutoMapper(typeof(Startup).Assembly);
            services.AddDbContext<BlitzDbContext>(builder =>
            {
                builder = builder
                    .EnableDetailedErrors(Environment.IsDevelopment())
                    .EnableSensitiveDataLogging(Environment.IsDevelopment());
                if (Configuration.GetConnectionString("BlitzPostgres") is { } postgresDsn)
                {
                    builder = builder.UseNpgsql(
                        postgresDsn,
                        pg => pg.MigrationsHistoryTable("__ef_migrations")
                    );
                }
            });
            services.AddTransient<IdentitySeeder>();

            services.AddRouting(o => o.LowercaseUrls = true);
            services.AddControllers(options => options.Filters.Add<MappingExceptionFilter>());
            services.AddCors(options => options.AddDefaultPolicy(builder => builder.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
            services.AddSwaggerGen(
                options =>
                {
                    options.CustomOperationIds(e => $"{e.ActionDescriptor.RouteValues["action"]}");
                    options.SwaggerDoc("v1", new OpenApiInfo {Title = "Blitz", Version = "v1"});
                    options.OperationFilter<PopulateMethodMetadataOperationFilter>();
                    options.AddSecurityDefinition("token", new OpenApiSecurityScheme
                    {
                        Type = SecuritySchemeType.Http,
                        Description = "Go to [/auth/login](/auth/login) to login, then execute /auth/token to generate a token",
                        BearerFormat = "JWT",
                        Scheme = OpenIddictConstants.Schemes.Bearer,
                        In = ParameterLocation.Header,
                        Name = HeaderNames.Authorization,
                    });
                    options.AddSecurityRequirement(new OpenApiSecurityRequirement
                    {
                        [new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "token",
                            },
                        }] = new string[] { }
                    });
                }
            );

            services.Configure<JwtOptions>(Configuration.GetSection(JwtOptions.Key));
            var jwtOptions = Configuration.GetSection(JwtOptions.Key).Get<JwtOptions>();
            
            services.AddTransient<IJwtTokenIssuer, JwtJwtTokenIssuer>();
            services.AddTransient<IExternalUserImporter, ThyExternalUserImporter>();
            // services.AddTransient<IClaimsTransformation, LoadAuthorizationClaimsTransformer>();
            services.AddAuthentication(options =>
                {
                    options.DefaultScheme = AppAuthenticationConstants.ApplicationScheme;
                    options.DefaultChallengeScheme = AppAuthenticationConstants.ExternalScheme;
                })
                .AddCookie(AppAuthenticationConstants.ApplicationScheme, options =>
                {
                    options.LoginPath = "/auth/login";
                    options.Events.OnRedirectToLogin = context =>
                    {
                        if (context.Request.IsApiRequest())
                        {
                            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        }

                        return Task.CompletedTask;
                    };
                    options.Events.OnRedirectToAccessDenied = context =>
                    {
                        if (context.Request.IsApiRequest())
                        {
                            context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        }

                        return Task.CompletedTask;
                    };
                })
                .AddThy(Configuration)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidIssuer = Environment.ApplicationName,
                        ValidateAudience = true,
                        ValidAudience = Environment.ApplicationName,
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = jwtOptions.SigningCredentials.Key,
                    };
                });


            services.AddScoped<IAuthorizationHandler, ProjectManagerRequirement>();
            services.AddAuthorization(options =>
            {
                options.DefaultPolicy = new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .AddAuthenticationSchemes(
                        JwtBearerDefaults.AuthenticationScheme,
                        AppAuthenticationConstants.ApplicationScheme
                    )
                    .Build();

                options.AddPolicy(AuthorizationPolicies.RequireProjectManager, AuthorizationPolicies.RequireProjectManagerPolicy);
                options.AddPolicy(AuthorizationPolicies.RequireAdmin, AuthorizationPolicies.RequireAdminPolicy);
            });


            services.AddHttpContextAccessor();
            services.AddSpaStaticFiles(options => { options.RootPath = "ClientApp/build"; });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, BlitzDbContext dbContext)
        {
            app
                .InitCronjobs()
                .InitGarbageCollector();

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseForwardedHeaders(new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.All
            });
            app.UseCors();
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
                    c.OAuthConfigObject.Scopes = new[] {"api"};
                    c.OAuthConfigObject.ClientId = "demoapp";
                    c.OAuthUsePkce();
                }
            );

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapSwagger("/openapi/{documentName}.json");
                endpoints.MapControllers();

                endpoints.MapFallbackToFile("index.html");
            });
        }
    }
}