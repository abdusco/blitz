using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Blitz.Web.Cronjobs;
using Blitz.Web.Projects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace Blitz.Web.Persistence
{
    public class BlitzDbContext : DbContext
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