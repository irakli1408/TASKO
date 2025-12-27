using Microsoft.AspNetCore.SignalR;
using Tasko.Application.Abstractions.Realtime;
using Tasko.Application.DTO.Notifications;

namespace Tasko.API.Realtime;

public sealed class SignalRNotificationRealtime : INotificationRealtime
{
    private readonly IHubContext<NotificationsHub> _hub;

    public SignalRNotificationRealtime(IHubContext<NotificationsHub> hub)
    {
        _hub = hub;
    }

    public Task NotificationCreated(long userId, NotificationDto dto, CancellationToken ct)
        => _hub.Clients
            .Group(NotificationsHub.UserGroup(userId))
            .SendAsync("notification.created", dto, ct);

    public Task UnreadCountChanged(long userId, int count, CancellationToken ct)
        => _hub.Clients
            .Group(NotificationsHub.UserGroup(userId))
            .SendAsync("notifications.unreadCount", new { count }, ct);

    public Task NotificationRead(long userId, long notificationId, CancellationToken ct)
        => _hub.Clients
            .Group(NotificationsHub.UserGroup(userId))
            .SendAsync("notification.read", new { id = notificationId }, ct);

    public Task NotificationsReadAll(long userId, CancellationToken ct)
        => _hub.Clients
            .Group(NotificationsHub.UserGroup(userId))
            .SendAsync("notifications.readAll", new { }, ct);
}
