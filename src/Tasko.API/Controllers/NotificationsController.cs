using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tasko.Application.Handlers.Notifications.Commands.MarkNotificationRead;
using Tasko.Application.Handlers.Notifications.Queries.GetMyNotifications;
using Tasko.Application.Handlers.Notifications.Queries.GetUnreadCount;

namespace Tasko.API.Controllers;

[ApiController]
[Route("api/v1/{culture}/notifications")]
[Authorize]
public sealed class NotificationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public NotificationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public Task<IReadOnlyList<MyNotificationDto>> GetMy([FromQuery] int skip = 0, [FromQuery] int take = 50, CancellationToken ct = default)
        => _mediator.Send(new GetMyNotificationsQuery(skip, take), ct);

    [HttpPost("{id:long}/read")]
    public Task MarkRead([FromRoute] long id, CancellationToken ct)
        => _mediator.Send(new MarkNotificationReadCommand(id), ct);

    [HttpGet("unread-count")]
    public Task<NotificationsUnreadCountDto> GetUnreadCount(CancellationToken ct)
    => _mediator.Send(new GetUnreadCountQuery(), ct);
}
