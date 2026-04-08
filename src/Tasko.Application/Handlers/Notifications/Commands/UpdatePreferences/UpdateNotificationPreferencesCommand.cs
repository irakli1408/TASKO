using MediatR;
using Tasko.Application.DTO.Notifications;

namespace Tasko.Application.Handlers.Notifications.Commands.UpdatePreferences;

public sealed record UpdateNotificationPreferencesCommand(
    bool NotifyNewOffers,
    bool NotifyTaskAssigned,
    bool NotifyNewMessages,
    bool NotifyTaskCompleted,
    bool NotifyMarketplaceUpdates
) : IRequest<NotificationPreferencesDto>;
