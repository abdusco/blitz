using System;

namespace Blitz.Web.Persistence
{
    public abstract class Entity : ITimestamped
    {
        public Guid Id { get; set; } = Guid.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; } = null;
    }

    public interface ITimestamped
    {
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}