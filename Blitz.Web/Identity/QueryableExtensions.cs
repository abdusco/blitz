using System.Linq;
using System.Security.Claims;
using Blitz.Web.Persistence;

namespace Blitz.Web.Identity
{
    internal static class QueryableExtensions
    {
        public static IQueryable<TEntity> FilterByClaims<TEntity>(this IQueryable<TEntity> queryable, ClaimsPrincipal principal)
            where TEntity : Entity
        {
            var claimType = typeof(TEntity).Name;
            var claims = principal.Claims.Where(c => c.Type == claimType).Select(c => c.Value);
            return queryable.Where(it => principal.IsInRole("admin") || claims.Contains(it.Id.ToString()));
        }
    }
}