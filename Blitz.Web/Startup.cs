using System;
using AutoMapper;
using Blitz.Web.Cronjobs;
using Blitz.Web.Hangfire;
using Blitz.Web.Maintenance;
using Blitz.Web.Persistence;
using Hangfire;
using Hangfire.EntityFrameworkCore;
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
            services.AddTransient<HttpRequestJob>();
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
            services.AddHangfire(
                configuration =>
                {
                    configuration.UseFilter(new AutomaticRetryAttribute {Attempts = 1});
                    configuration.UseEFCoreStorage(ConfigureDbContext)
                        .UseDatabaseCreator();
                }
            );
            services.AddHangfireServer(options => options.ServerName = Environment.ApplicationName);
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

            app.UseGarbageCollector();

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
            app.UseAuthorization();
            app.UseEndpoints(
                endpoints =>
                {
                    endpoints.MapControllers();
                    endpoints.MapFallbackToFile("ui/index.html");
                }
            );
        }
    }
}