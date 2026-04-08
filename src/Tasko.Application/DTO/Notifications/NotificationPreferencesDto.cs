namespace Tasko.Application.DTO.Notifications;

public sealed class NotificationPreferencesDto
{
    public bool NotifyNewOffers { get; init; }
    public bool NotifyTaskAssigned { get; init; }
    public bool NotifyNewMessages { get; init; }
    public bool NotifyTaskCompleted { get; init; }
    public bool NotifyMarketplaceUpdates { get; init; }
}
