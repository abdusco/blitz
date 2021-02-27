using System;
using System.Collections.Generic;
using Blitz.Web.Persistence;
using Microsoft.AspNetCore.Identity;

namespace Blitz.Web.Identity
{
    public class Role
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Title { get; init; }
        public ICollection<User> Users { get; set; }
    }
}