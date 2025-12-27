using MediatR;

namespace Tasko.Application.Handlers.Notifications.Queries.GetUnreadCount;

public sealed record GetUnreadCountQuery() : IRequest<NotificationsUnreadCountDto>;
