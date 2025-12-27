using Tasko.Application.DTO.Notifications;

namespace Tasko.Application.Abstractions.Realtime;

public interface INotificationRealtime
{
    Task NotificationCreated(long userId, NotificationDto dto, CancellationToken ct);
}
