using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Threading.Tasks;
using Blitz.Web.Auth;
using Blitz.Web.Cronjobs;
using Blitz.Web.Hangfire;
using Blitz.Web.Http;
using Blitz.Web.Identity;
using Blitz.Web.Maintenance;
using Blitz.Web.Persistence;
using Hangfire;
using IdentityModel;
using Lib.AspNetCore.Auth.Intranet;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Net.Http.Headers;
using Microsoft.OpenApi.Models;
using OpenIddict.Abstractions;
using Swashbuckle.AspNetCore.SwaggerUI;

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
            services.AddCors(options => options.AddDefaultPolicy(builder =>
                builder.AllowAnyHeader().AllowAnyMethod().AllowCredentials()
                    .WithOrigins("http://localhost:3000")
            ));
            services.Configure<SwaggerUIOptions>(options =>
            {
                options.DocumentTitle = "Blitz API";
                options.DisplayOperationId();
                options.RoutePrefix = "api";
                options.SwaggerEndpoint("/openapi/v1.json", "Blitz API");
            });
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
                        AuthenticationType = JwtBearerDefaults.AuthenticationScheme,
                        ValidateIssuer = true,
                        ValidIssuer = Environment.ApplicationName,
                        ValidateAudience = true,
                        ValidAudience = Environment.ApplicationName,
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = jwtOptions.SigningCredentials.Key,
                    };
                    // dont map jwt metadata claims
                    var validator = options.SecurityTokenValidators.Cast<JwtSecurityTokenHandler>().First();
                    validator.InboundClaimFilter.Add(JwtClaimTypes.Issuer);
                    validator.InboundClaimFilter.Add(JwtClaimTypes.Expiration);
                    validator.InboundClaimFilter.Add(JwtClaimTypes.NotBefore);
                    validator.InboundClaimFilter.Add(JwtClaimTypes.IssuedAt);
                    validator.InboundClaimFilter.Add(JwtClaimTypes.Audience);
                });


            services.AddScoped<IAuthorizationHandler, ProjectManagerRequirement>();
            services.AddAuthorization(options =>
            {
                options.DefaultPolicy = new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .AddAuthenticationSchemes(
                        // intranet auth doesn't provide a useful nameidentifier claim
                        // so we let other auth schemes override it if present
                        IntranetDefaults.AuthenticationScheme,
                        AppAuthenticationConstants.ApplicationScheme,
                        JwtBearerDefaults.AuthenticationScheme
                    )
                    .Build();

                options.AddPolicy(AuthorizationPolicies.RequireProjectManager, AuthorizationPolicies.RequireProjectManagerPolicy);
                options.AddPolicy(AuthorizationPolicies.RequireAdmin, AuthorizationPolicies.RequireAdminPolicy);
            });


            services.AddHttpContextAccessor();
            services.AddSpaStaticFiles(options => { options.RootPath = "ClientApp/build"; });
            services.Configure<ForwardedHeadersOptions>(options =>
            {
                options.ForwardedHeaders = ForwardedHeaders.All;
                options.KnownNetworks.Clear();
                options.KnownProxies.Clear();
            });
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

            app.UseForwardedHeaders();
            app.UseCors();
            app.UseStaticFiles();

            // app.UseHttpsRedirection();
            app.UseRouting();
            app.UseAuthentication();
            app.UseAuthorization();

            app.UseSwaggerUI();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapSwagger("/openapi/{documentName}.json");
                endpoints.MapControllers();

                endpoints.MapFallbackToFile("index.html");
            });
        }
    }
}