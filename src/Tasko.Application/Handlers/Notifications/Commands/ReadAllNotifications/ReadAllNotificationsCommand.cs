using MediatR;

namespace Tasko.Application.Handlers.Notifications.Commands.ReadAllNotifications;

public sealed record ReadAllNotificationsCommand() : IRequest;
