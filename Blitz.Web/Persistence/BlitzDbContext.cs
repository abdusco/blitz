using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Blitz.Web.Cronjobs;
using Blitz.Web.Identity;
using Blitz.Web.Presets;
using Blitz.Web.Projects;
using Hangfire.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Blitz.Web.Persistence
{
    public class BlitzDbContext : DbContext
    {
        public DbSet<Project> Projects { get; set; }
        public DbSet<Cronjob> Cronjobs { get; set; }
        public DbSet<Execution> Executions { get; set; }
        public DbSet<ExecutionStatus> StatusUpdates { get; set; }

        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<UserClaim> UserClaims { get; set; }

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
            // add hangfire models
            modelBuilder.OnHangfireModelCreating();

            modelBuilder.Entity<Cronjob>(
                builder =>
                {
                    builder.Property(e => e.ProjectId).IsRequired();
                    builder.Property(e => e.Cron)
                        .HasConversion(val => val.Cron, dbVal => new CronExpression(dbVal));
                    builder.Property(e => e.Auth)
                        .HasConversion(
                            auth => JsonSerializer.Serialize(auth, null),
                            s => JsonSerializer.Deserialize<TokenAuth>(s, null)
                        ).HasColumnType("JSONB");
                }
            );
            modelBuilder.Entity<Project>(builder =>
            {
                builder.HasIndex(p => p.Title).IsUnique();
                builder.HasIndex(e => new { e.Title, e.Version }).IsUnique();
                builder.Property(e => e.Auth)
                    .HasConversion(
                        auth => JsonSerializer.Serialize(auth, null),
                        s => JsonSerializer.Deserialize<TokenAuth>(s, null)
                    ).HasColumnType("JSONB");
            });
            modelBuilder.Entity<ConfigTemplate>(builder =>
            {
                builder.Property(e => e.Auth)
                    .HasConversion(
                        auth => JsonSerializer.Serialize(auth, null),
                        s => JsonSerializer.Deserialize<TokenAuth>(s, null)
                    ).HasColumnType("JSONB");
            });
            modelBuilder.Entity<ExecutionStatus>(
                builder =>
                {
                    var comparer = new ValueComparer<Dictionary<string, object>>(
                        (d1, d2) => d1.SequenceEqual(d2),
                        d => d.Aggregate(0, (agg, val) => HashCode.Combine(agg, val.GetHashCode())),
                        d => d
                    );
                    builder.Property(e => e.Details).HasConversion(
                        val => JsonSerializer.Serialize(val, null),
                        dbVal => JsonSerializer.Deserialize<Dictionary<string, object>>(dbVal, null),
                        comparer
                    );
                    builder.Property(e => e.State).HasConversion(
                        val => val.Name,
                        dbValue => ExecutionState.FromName(dbValue, true)
                    );
                }
            );
            modelBuilder.Entity<User>(builder =>
            {
                builder.ToTable("Users");
                builder.Property(e => e.Name).IsRequired();
                builder.Property(e => e.Email).IsRequired();
                builder.HasIndex(e => e.Email).IsUnique();
                builder
                    .HasMany(e => e.Roles)
                    .WithMany(r => r.Users)
                    .UsingEntity<Dictionary<string, object>>(
                        "UserRole",
                        m2m => m2m.HasOne<Role>().WithMany().HasForeignKey("RoleId"),
                        m2m => m2m.HasOne<User>().WithMany().HasForeignKey("UserId")
                    );
                builder.HasMany<UserClaim>(e => e.Claims).WithOne(e => e.User);
            });
            modelBuilder.Entity<Role>(builder =>
            {
                builder.ToTable("Roles");
                builder.Property(e => e.Name).IsRequired();
                builder.HasIndex(e => e.Name).IsUnique();
            });
            modelBuilder.Entity<UserClaim>(builder =>
            {
                builder.ToTable("UserClaims");
                builder.Property(e => e.UserId).IsRequired();
                builder.Property(e => e.ClaimType).IsRequired();
                builder.Property(e => e.ClaimValue).IsRequired();
                builder.HasIndex(e => e.ClaimType);
            });

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
                    entityType.AddIndex(new[] { createdAt });
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