using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tasko.API.Settings;
using Tasko.Application.DTO.Chats;
using Tasko.Application.DTO.Tasks;
using Tasko.Application.Handlers.Chats.Queries.GetTaskMessages;
using Tasko.Application.Handlers.Tasks.Commands.AssignOffer;
using Tasko.Application.Handlers.Tasks.Commands.CreateOffer;
using Tasko.Application.Handlers.Tasks.Commands.CreateTask;
using Tasko.Application.Handlers.Tasks.Commands.PublishTask;

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
}


