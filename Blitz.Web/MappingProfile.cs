using System.Linq;
using AutoMapper;
using Blitz.Web.Cronjobs;

namespace Blitz.Web
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<string, CronExpression>().ConvertUsing(s => new CronExpression(s));
            CreateMap<CronExpression, string>().ConvertUsing(s => s.Cron);
            CreateMap<string, ExecutionState>().ConvertUsing(s => ExecutionState.FromValue(s));
            CreateMap<ExecutionState, string>().ConvertUsing(s => s.Value);
        }
    }
}