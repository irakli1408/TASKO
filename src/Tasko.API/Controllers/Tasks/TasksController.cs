using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tasko.API.Realtime.Models;
using Tasko.API.Settings;
using Tasko.Application.DTO.Chats;
using Tasko.Application.DTO.Tasks;
using Tasko.Application.Handlers.Chats.Commands.MarkMessagesRead;
using Tasko.Application.Handlers.Chats.Commands.SendTaskMessage;
using Tasko.Application.Handlers.Chats.Queries.GetTaskMessages;
using Tasko.Application.Handlers.Chats.Queries.GetUnreadCount;
using Tasko.Application.Handlers.Tasks.Commands.AssignOffer;
using Tasko.Application.Handlers.Tasks.Commands.CreateOffer;
using Tasko.Application.Handlers.Tasks.Commands.CreateTask;
using Tasko.Application.Handlers.Tasks.Commands.PublishTask;
using Tasko.Application.Handlers.Tasks.Queries.GetTaskOffers;
using Tasko.Application.Handlers.Tasks.Queries.GetTaskStats;

namespace Tasko.API.Controllers.Tasks;

[ApiController]
[Route("api/v1/{culture}/tasks")]
public sealed class TasksController : ApiControllerBase
{
    public TasksController(ISender sender) : base(sender) { }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<TaskDto>> Create([FromBody] CreateTaskCommand command, CancellationToken ct)
        => Ok(await Sender.Send(command, ct));

    [HttpPost("{taskId:long}/publish")]
    [Authorize]
    public async Task<IActionResult> Publish(long taskId, CancellationToken ct)
    {
        await Sender.Send(new PublishTaskCommand(taskId), ct);
        return NoContent();
    }

    [HttpGet("{taskId:long}/messages")]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<ChatMessageDto>>> GetMessages(
    [FromRoute] long taskId,
    [FromQuery] int skip = 0,
    [FromQuery] int take = 50,
    CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new GetTaskMessagesQuery(taskId, skip, take), ct));
    }

    public sealed class CreateOfferBody
    {
        public decimal Price { get; init; }
        public string? Comment { get; init; }
    }

    [HttpPost("{taskId:long}/offers")]
    [Authorize]
    public async Task<ActionResult<OfferDto>> CreateOffer(long taskId, [FromBody] CreateOfferBody body, CancellationToken ct)
        => Ok(await Sender.Send(new CreateOfferCommand(taskId, body.Price, body.Comment), ct));

    [HttpPost("{taskId:long}/assign/{offerId:long}")]
    [Authorize]
    public async Task<IActionResult> Assign(long taskId, long offerId, CancellationToken ct)
    {
        await Sender.Send(new AssignOfferCommand(taskId, offerId), ct);
        return NoContent();
    }

    [HttpPost("{taskId:long}/messages")]
    [Authorize]
    public async Task<ActionResult<ChatMessageDto>> SendMessage(
    [FromRoute] long taskId,
    [FromBody] SendMessageBody body,
    CancellationToken ct)
    {
        return Ok(await Sender.Send(new SendTaskMessageCommand(taskId, body.Text), ct));
    }

    [HttpGet("{taskId:long}/messages/unread-count")]
    [Authorize]
    public async Task<ActionResult<UnreadCountDto>> GetUnreadCount([FromRoute] long taskId, CancellationToken ct)
    => Ok(await Sender.Send(new GetUnreadCountQuery(taskId), ct));

    [HttpPatch("{taskId:long}/messages/read")]
    [Authorize]
    public async Task<IActionResult> MarkRead(
    [FromRoute] long taskId,
    [FromBody] MarkReadBody body,
    CancellationToken ct)
    {
        await Sender.Send(new MarkMessagesReadCommand(taskId, body.LastReadMessageId), ct);
        return NoContent();
    }


    [HttpGet("{taskId:long}/offers")]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<OfferDto>>> GetOffers(
    [FromRoute] long taskId,
    [FromQuery] int skip = 0,
    [FromQuery] int take = 50,
    CancellationToken ct = default)
    => Ok(await Sender.Send(new GetTaskOffersQuery(taskId, skip, take), ct));

    [HttpGet("{taskId:long}/stats")]
    [Authorize]
    public async Task<ActionResult<TaskStatsDto>> GetStats(
        [FromRoute] long taskId,
        CancellationToken ct)
        => Ok(await Sender.Send(new GetTaskStatsQuery(taskId), ct));
}




