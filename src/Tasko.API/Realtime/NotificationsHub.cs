using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Tasko.API.Realtime;

[Authorize]
public sealed class NotificationsHub : Hub
{
    public static string UserGroup(long userId) => $"user-{userId}";

    public override async Task OnConnectedAsync()
    {
        var userIdStr =
            Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
            Context.User?.FindFirst("sub")?.Value;

        if (long.TryParse(userIdStr, out var userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(userId));
        }

        await base.OnConnectedAsync();
    }
}
