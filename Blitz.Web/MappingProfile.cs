using System.Linq;
using System.Net.Http;
using AutoMapper;
using Blitz.Web.Cronjobs;

namespace Blitz.Web
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            AllowNullCollections = true;
            CreateMap<string, CronExpression>().ConvertUsing(s => new CronExpression(s));
            CreateMap<CronExpression, string>().ConvertUsing(s => s.Cron);
            CreateMap<string, ExecutionState>().ConvertUsing(s => ExecutionState.FromName(s, true));
            CreateMap<ExecutionState, string>().ConvertUsing(s => s.Name);
        }
    }
}