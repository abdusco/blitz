using System;

namespace Blitz.Web.Hangfire
{
    public class HangfireSettings
    {
        public string TimeZoneId { get; set; }
        public TimeZoneInfo TimeZone => TimeZoneInfo.FindSystemTimeZoneById(TimeZoneId);
    }
}