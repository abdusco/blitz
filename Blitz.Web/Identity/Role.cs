using System;
using System.Collections.Generic;
using Blitz.Web.Persistence;
using Microsoft.AspNetCore.Identity;
#nullable enable
namespace Blitz.Web.Identity
{
    public class Role
    {
        public Role(string name, string? title = null)
        {
            Name = name;
            Title = title ?? name;
        }
        public Guid Id { get; set; } = Guid.Empty;
        public string Name { get; set; }
        public string Title { get; init; }
        public ICollection<User> Users { get; set; } = new List<User>();
    }
}