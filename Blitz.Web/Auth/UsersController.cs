using System.Collections.Generic;
using System.Threading.Tasks;
using AutoMapper;
using Blitz.Web.Http;
using Blitz.Web.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blitz.Web.Auth
{
    [Authorize(Policy = AuthorizationPolicies.RequireAdmin)]
    public class UsersController : ApiController
    {
        [AutoMap(typeof(User))]
        public record UserListDto
        {
            public string Id { get; set; }
            public string Email { get; set; }
            public string Name { get; set; }
        }

        [HttpGet]
        public async Task<ActionResult<List<User>>> ListAllUsers()
        {
            return Ok();
        }
    }
}