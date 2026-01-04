using System.Security.Claims;

namespace Tasko.API.Common.Model
{
    public static class GetUserOrIpKey
    {
       public static string UserOrIpKey(HttpContext ctx)
        {
            var userId = ctx.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrWhiteSpace(userId))
                return $"uid:{userId}";
            return $"ip:{GetClientIp(ctx)}";
        }

       public static string GetClientIp(HttpContext ctx)
            => ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}
