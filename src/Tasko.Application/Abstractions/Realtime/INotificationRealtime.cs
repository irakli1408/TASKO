using Tasko.Application.DTO.Notifications;

namespace Tasko.Application.Abstractions.Realtime;

public interface INotificationRealtime
{
    Task NotificationCreated(long userId, NotificationDto dto, CancellationToken ct);

    // badge
    Task UnreadCountChanged(long userId, int count, CancellationToken ct);

    // ✅ specific notification read
    Task NotificationRead(long userId, long notificationId, CancellationToken ct);
}
