using MediatR;

namespace Tasko.Application.Handlers.Notifications.Queries.GetMyNotifications;

public sealed record GetMyNotificationsQuery(int Skip = 0, int Take = 50) : IRequest<IReadOnlyList<MyNotificationDto>>;
