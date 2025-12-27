using MediatR;

namespace Tasko.Application.Handlers.Notifications.Commands.MarkNotificationRead;

public sealed record MarkNotificationReadCommand(long NotificationId) : IRequest;
