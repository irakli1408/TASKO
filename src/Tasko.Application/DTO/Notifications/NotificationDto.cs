using Tasko.Domain.Entities.Notifications;

namespace Tasko.Application.DTO.Notifications;

public sealed class NotificationDto
{
    public long Id { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = null!;
    public string Body { get; set; } = null!;
    public string? DataJson { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
