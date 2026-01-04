using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Tasko.API.Settings;
using Tasko.Application.Handlers.Notifications.Commands.MarkNotificationRead;
using Tasko.Application.Handlers.Notifications.Commands.ReadAllNotifications;
using Tasko.Application.Handlers.Notifications.Queries.GetMyNotifications;
using Tasko.Application.Handlers.Notifications.Queries.GetUnreadCount;

namespace Tasko.API.Controllers.NotificationApp;

[Authorize]
[EnableRateLimiting("read")]
public sealed class NotificationsController : ApiControllerBase
{
    public NotificationsController(ISender sender) : base(sender) { }

    [HttpGet]
    public Task<IReadOnlyList<MyNotificationDto>> GetMy(
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50,
        CancellationToken ct = default)
        => Sender.Send(new GetMyNotificationsQuery(skip, take), ct);

    [HttpPost("{id:long}/read")]
    [EnableRateLimiting("write")]
    public Task MarkRead([FromRoute] long id, CancellationToken ct)
        => Sender.Send(new MarkNotificationReadCommand(id), ct);

    [HttpGet("unread-count")]
    public Task<NotificationsUnreadCountDto> GetUnreadCount(CancellationToken ct)
        => Sender.Send(new GetUnreadCountQuery(), ct);

    [HttpPost("read-all")]
    [EnableRateLimiting("write")]
    public Task ReadAll(CancellationToken ct)
        => Sender.Send(new ReadAllNotificationsCommand(), ct);
}
