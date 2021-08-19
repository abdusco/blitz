﻿using System;
using System.Threading.Tasks;
using Blitz.Web.Cronjobs;
using Hangfire;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Blitz.Web.Hangfire
{
    public class HangfireCronjobRegistrationService : ICronjobRegistrationService
    {
        private readonly IRecurringJobManager _recurringJobManager;
        private readonly ILogger<HangfireCronjobRegistrationService> _logger;
        private readonly HangfireSettings _hangfireSettings;

        public HangfireCronjobRegistrationService(IRecurringJobManager recurringJobManager,
                                                  ILogger<HangfireCronjobRegistrationService> logger,
                                                  IOptions<HangfireSettings> hangfireSettings)
        {
            _recurringJobManager = recurringJobManager;
            _logger = logger;
            _hangfireSettings = hangfireSettings.Value;
        }

        public Task Add(Cronjob cronjob)
        {
            _logger.LogInformation("Registering cronjob '{CronjobTitle}' ({CronjobId}) with Hangfire", cronjob.Title, cronjob.Id);
            _recurringJobManager.AddOrUpdate<HttpRequestSender>(
                cronjob.GetHangfireId(),
                job => job.SendRequestAsync(cronjob.Id, default, default),
                cronjob.Cron.ToString(),
                _hangfireSettings.TimeZone
            );
            return Task.CompletedTask;
        }

        public Task Remove(Cronjob cronjob)
        {
            _logger.LogInformation("Removing cronjob '{CronjobTitle}' ({CronjobId}) from Hangfire", cronjob.Title, cronjob.Id);
            _recurringJobManager.RemoveIfExists(cronjob.GetHangfireId());
            return Task.CompletedTask;
        }
    }

    internal static class CronjobExtensions
    {
        public static string GetHangfireId(this Cronjob cronjob) => $"{cronjob.Id}.{cronjob.Title}";
    }
}