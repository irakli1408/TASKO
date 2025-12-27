using Tasko.Application.DTO.Notifications;

namespace Tasko.Application.Abstractions.Realtime;

public interface INotificationRealtime
{
    Task NotificationCreated(long userId, NotificationDto dto, CancellationToken ct);

    // realtime badge
    Task UnreadCountChanged(long userId, int count, CancellationToken ct);
}
