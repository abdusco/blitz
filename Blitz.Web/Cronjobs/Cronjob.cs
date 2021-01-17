using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Ardalis.SmartEnum;
using Blitz.Web.Persistence;
using Blitz.Web.Projects;

namespace Blitz.Web.Cronjobs
{
    public record CronExpression
    {
        public string Cron { get; init; }

        public override string ToString() => Cron;

        public CronExpression(string cron)
        {
            if (cron.Split(" ", StringSplitOptions.RemoveEmptyEntries).Length != 5)
            {
                throw new ArgumentException("Invalid cron expression", nameof(cron));
            }

            Cron = cron;
        }
    }

    public class Cronjob : Entity
    {
        public Guid ProjectId { get; set; }
        public Project Project { get; set; }
        public string Title { get; set; }
        public CronExpression Cron { get; set; }
        public string Url { get; set; }
        public string HttpMethod { get; set; }
        public bool Enabled { get; set; } = true;

        public List<Execution> Executions { get; set; } = new();
        public Execution LastExecution => Executions.OrderByDescending(e => e.CreatedAt).FirstOrDefault();

        public async Task<Execution> TriggerAsync(ICronjobTriggerer triggerer, CancellationToken cancellationToken)
        {
            var exe = new Execution(this);
            Executions.Add(exe);
            exe.UpdateStatus(ExecutionState.Pending);
            await triggerer.TriggerAsync(this);
            exe.UpdateStatus(ExecutionState.Triggered);
            return exe;
        }
    }

    public class Execution : Entity
    {
        private Execution()
        {
        }

        public Execution(Cronjob cronjob)
        {
            Cronjob = cronjob;
        }

        public Guid CronjobId { get; set; }
        public Cronjob Cronjob { get; set; }

        public List<ExecutionStatus> Updates { get; set; } = new();

        // this property is denormalized for performance reasons
        public ExecutionState State { get; private set; } = ExecutionState.Pending;

        public void UpdateStatus(ExecutionStatus executionStatus)
        {
            Updates.Add(executionStatus ?? throw new ArgumentNullException(nameof(executionStatus)));
            State = Updates.OrderByDescending(u => u.CreatedAt).First().State;
        }

        public void UpdateStatus(ExecutionState state) => UpdateStatus(new ExecutionStatus(this, state));
    }

    public class ExecutionStatus : Entity
    {
        private ExecutionStatus()
        {
        }

        public ExecutionStatus(Execution execution, ExecutionState state)
        {
            Execution = execution;
            State = state;
        }

        public Guid ExecutionId { get; set; }
        public Execution Execution { get; set; }
        public ExecutionState State { get; set; }
        public Dictionary<string, object> Details { get; set; }
    }

    public class ExecutionState : SmartEnum<ExecutionState, string>
    {
        public static readonly ExecutionState Pending = new(nameof(Pending), nameof(Pending).ToLowerInvariant());
        public static readonly ExecutionState Triggered = new(nameof(Triggered), nameof(Triggered).ToLowerInvariant());
        public static readonly ExecutionState Started = new(nameof(Started), nameof(Started).ToLowerInvariant());
        public static readonly ExecutionState Finished = new(nameof(Finished), nameof(Finished).ToLowerInvariant());
        public static readonly ExecutionState Failed = new(nameof(Failed), nameof(Failed).ToLowerInvariant());

        private ExecutionState(string name, string value) : base(name, value)
        {
        }
    }
}