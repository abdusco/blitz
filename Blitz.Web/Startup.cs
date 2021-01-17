using AutoMapper;
using Blitz.Web.Cronjobs;
using Blitz.Web.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;

namespace Blitz.Web
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddTransient<ICronjobTriggerer, HangfireCronjobTriggerer>();
            services.AddAutoMapper(typeof(Startup).Assembly);
            services.AddDbContext<BlitzDbContext>(
                builder =>
                {
                    builder = builder
                        .EnableDetailedErrors().EnableSensitiveDataLogging();
                    if (Configuration.GetConnectionString("BlitzSqlite") is { } sqliteDsn)
                    {
                        builder = builder.UseSqlite(sqliteDsn);
                    }
                    else if (Configuration.GetConnectionString("BlitzSqlServer") is { } sqlServerDsn)
                    {
                        builder = builder.UseSqlServer(sqlServerDsn);
                    }
                }
            );
            services.AddRouting(o => o.LowercaseUrls = true);
            services.AddControllers();
            services.AddSwaggerGen(
                c =>
                {
                    c.CustomOperationIds(e => $"{e.ActionDescriptor.RouteValues["action"]}");
                    c.SwaggerDoc("v1", new OpenApiInfo {Title = "Blitz.Web", Version = "v1"});
                }
            );
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, BlitzDbContext dbContext)
        {
            // dbContext.Database.EnsureDeleted();
            dbContext.Database.EnsureCreated();

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
            app.UseHttpsRedirection();
            app.UseRouting();
            app.UseAuthorization();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                endpoints.MapFallbackToFile("ui/index.html");
            });
        }
    }
}