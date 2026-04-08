using MediatR;
using Tasko.Application.DTO.Notifications;

namespace Tasko.Application.Handlers.Notifications.Queries.GetMyPreferences;

public sealed record GetMyNotificationPreferencesQuery : IRequest<NotificationPreferencesDto>;
