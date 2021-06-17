using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Ardalis.SmartEnum;
using Blitz.Web.Persistence;
using Blitz.Web.Projects;
using Blitz.Web.Templates;

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

        public string Description { get; set; }
        public CronExpression Cron { get; set; }
        public string Url { get; set; }
        public string HttpMethod { get; set; }
        public bool Enabled { get; set; } = true;

        public TokenAuth Auth { get; set; }
        public ConfigTemplate Template { get; set; }
        public bool IsAuthenticated { get; set; }
        public ITokenAuth EffectiveAuth => TokenAuth.Combine(new[] { Auth, Template?.Auth, Project?.Auth, Project?.Template?.Auth });

        private Cronjob()
        {
        }

        public Cronjob(Project project)
        {
            Project = project;
        }

        public List<Execution> Executions { get; set; } = new();
        public Execution LastExecution => Executions.OrderByDescending(e => e.CreatedAt).FirstOrDefault();

        public async Task<Execution> TriggerAsync(ICronjobTriggerer triggerer)
        {
            var exe = new Execution(this);
            Executions.Add(exe);
            var executionId = await triggerer.TriggerAsync(this);
            exe.Id = executionId;
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
        public ExecutionState State => Updates.OrderByDescending(u => u.CreatedAt).FirstOrDefault()?.State ?? ExecutionState.Unknown;

        public void UpdateStatus(ExecutionStatus executionStatus)
        {
            Updates.Add(executionStatus ?? throw new ArgumentNullException(nameof(executionStatus)));
        }

        public void UpdateStatus(ExecutionState state, Dictionary<string, object> details) =>
            UpdateStatus(new ExecutionStatus(this, state) { Details = details });

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

    public class ExecutionState : SmartEnum<ExecutionState, int>
    {
        public static readonly ExecutionState Unknown = new(nameof(Unknown).ToLowerInvariant(), -1);
        public static readonly ExecutionState Pending = new(nameof(Pending).ToLowerInvariant(), 0);
        public static readonly ExecutionState Triggered = new(nameof(Triggered).ToLowerInvariant(), 10);
        public static readonly ExecutionState Started = new(nameof(Started).ToLowerInvariant(), 20);
        public static readonly ExecutionState Finished = new(nameof(Finished).ToLowerInvariant(), 30);
        public static readonly ExecutionState Failed = new(nameof(Failed).ToLowerInvariant(), 40);
        public static readonly ExecutionState TimedOut = new(nameof(TimedOut).ToLowerInvariant(), 50);

        private ExecutionState(string name, int value) : base(name, value)
        {
        }
    }
}