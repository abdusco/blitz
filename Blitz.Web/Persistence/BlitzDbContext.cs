using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Blitz.Web.Cronjobs;
using Blitz.Web.Identity;
using Blitz.Web.Projects;
using Hangfire.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace Blitz.Web.Persistence
{
    public class BlitzDbContext : IdentityDbContext<User, Role, string>
    {
        public DbSet<Project> Projects { get; set; }
        public DbSet<Cronjob> Cronjobs { get; set; }
        public DbSet<Execution> Executions { get; set; }
        public DbSet<ExecutionStatus> StatusUpdates { get; set; }

        public BlitzDbContext(DbContextOptions<BlitzDbContext> options)
            : base(options)
        {
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = new CancellationToken())
        {
            foreach (var entry in ChangeTracker.Entries<ITimestamped>())
            {
                if (entry.State == EntityState.Modified)
                {
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                }
            }

            return base.SaveChangesAsync(cancellationToken);
        }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // add identity models
            base.OnModelCreating(modelBuilder);
            // add hangfire models
            modelBuilder.OnHangfireModelCreating();

            modelBuilder.Entity<User>(builder =>
            {
                /*
                 * The navigation properties have been removed from the base IdentityUser class
                 * So we redefine them here to prevent creating double foreign keys
                 */
                builder
                    .HasMany(e => e.Claims)
                    .WithOne()
                    .HasForeignKey(e => e.UserId)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Cascade);

                builder
                    .HasMany(e => e.Logins)
                    .WithOne()
                    .HasForeignKey(e => e.UserId)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Cascade);

                builder
                    .HasMany(e => e.Roles)
                    .WithOne()
                    .HasForeignKey(e => e.UserId)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Cascade);

                // remove unused columns
                builder.Ignore(e => e.PhoneNumber);
                builder.Ignore(e => e.PhoneNumberConfirmed);
                builder.Ignore(e => e.AccessFailedCount);
                builder.Ignore(e => e.LockoutEnabled);
                builder.Ignore(e => e.LockoutEnd);
                builder.Ignore(e => e.TwoFactorEnabled);
            });
            // modelBuilder.Entity<Role>(builder =>
            // {
            //     builder.HasMany<IdentityUserRole<string>>().WithOne().HasForeignKey(ur => ur.RoleId).IsRequired();
            // });
            // modelBuilder.Entity<IdentityUserRole<string>>(b =>
            // {
            //     b.ToTable("AspNetUserRoles");
            //     b.HasKey(r => new {r.UserId, r.RoleId});
            // });

            modelBuilder.Entity<Cronjob>(
                builder =>
                {
                    builder.Property(e => e.ProjectId).IsRequired();
                    builder.Property(e => e.Cron)
                        .HasConversion(val => val.Cron, dbVal => new CronExpression(dbVal));
                }
            );
            modelBuilder.Entity<Project>(builder => builder.HasIndex(p => p.Title).IsUnique());
            modelBuilder.Entity<ExecutionStatus>(
                builder =>
                {
                    builder.Property(e => e.Details).HasConversion(
                        val => JsonSerializer.Serialize(val, null),
                        dbVal => JsonSerializer.Deserialize<Dictionary<string, object>>(dbVal, null)
                    );
                    builder.Property(e => e.State).HasConversion(
                        val => val.Name,
                        dbValue => ExecutionState.FromName(dbValue, true)
                    );
                }
            );

            modelBuilder.ConfigureTimestamps();
            modelBuilder.ApplyNamingConventions();
        }
    }

    internal static class ModelBuilderExtensions
    {
        public static void ConfigureTimestamps(this ModelBuilder modelBuilder)
        {
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                if (entityType.FindProperty(nameof(ITimestamped.CreatedAt)) is IMutableProperty createdAt)
                {
                    createdAt.SetDefaultValueSql("current_timestamp");
                    entityType.AddIndex(new[] {createdAt});
                }
            }
        }

        public static void ApplyNamingConventions(this ModelBuilder modelBuilder)
        {
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                entityType.SetTableName(entityType.GetTableName().Underscore());

                foreach (var property in entityType.GetProperties())
                    property.SetColumnName(property.GetColumnBaseName().Underscore());

                foreach (var index in entityType.GetIndexes())
                    index.SetDatabaseName(index.GetDatabaseName().Underscore());

                foreach (var foreignKey in entityType.GetForeignKeys())
                    foreignKey.SetConstraintName(foreignKey.GetConstraintName().Underscore());

                foreach (var key in entityType.GetDeclaredKeys())
                    key.SetName(key.GetName().Underscore());
            }
        }
    }

    internal static class StringExtensions
    {
        public static string Underscore(this string input)
        {
            return Regex.Replace(
                Regex.Replace(
                    Regex.Replace(input, @"([\p{Lu}]+)([\p{Lu}][\p{Ll}])", "$1_$2"), @"([\p{Ll}\d])([\p{Lu}])",
                    "$1_$2"
                ), @"[-\s]", "_"
            ).ToLowerInvariant();
        }
    }

    internal static class TypeExtensions
    {
        public static bool IsSubclassOfRawGeneric(this Type generic, Type toCheck)
        {
            while (toCheck != null && toCheck != typeof(object))
            {
                var cur = toCheck.IsGenericType ? toCheck.GetGenericTypeDefinition() : toCheck;
                if (generic == cur)
                {
                    return true;
                }

                toCheck = toCheck.BaseType;
            }

            return false;
        }
    }
}