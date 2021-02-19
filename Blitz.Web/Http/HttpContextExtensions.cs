using System;
using System.Linq;
using System.Net.Mime;
using Microsoft.AspNetCore.Http;
using Microsoft.Net.Http.Headers;

namespace Blitz.Web.Http
{
    internal static class HttpContextExtensions
    {
        public static bool IsApiRequest(this HttpRequest request)
        {
            var isAjax = string.Equals(request.Query[HeaderNames.XRequestedWith], "XMLHttpRequest", StringComparison.Ordinal) ||
                         string.Equals(request.Headers[HeaderNames.XRequestedWith], "XMLHttpRequest", StringComparison.Ordinal);
            var isJson = string.Equals(request.Headers[HeaderNames.Accept], MediaTypeNames.Application.Json,
                StringComparison.InvariantCultureIgnoreCase);
            return isAjax || isJson;
        }
    }
}