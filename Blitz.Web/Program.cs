using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Blitz.Web.Identity;
using Blitz.Web.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Blitz.Web
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var host = CreateHostBuilder(args).Build();

            if (args.Contains("--seed"))
            {
                using var scope = host.Services.CreateScope();
                
                var cancellationToken = scope.ServiceProvider.GetRequiredService<IHostApplicationLifetime>().ApplicationStopping;
                var db = scope.ServiceProvider.GetRequiredService<BlitzDbContext>();
                // var seeder = scope.ServiceProvider.GetRequiredService<IdentitySeeder>();
                
                await db.Database.MigrateAsync(cancellationToken);
                // await seeder.SeedAsync(cancellationToken);
            }

            await host.RunAsync();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder => { webBuilder.UseStartup<Startup>(); });
    }
}