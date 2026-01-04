using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;
using Tasko.API.Common.Model;
using Tasko.API.Realtime.Models;
using Tasko.API.Settings;
using Tasko.Application.DTO.Chats;
using Tasko.Application.DTO.Media;
using Tasko.Application.DTO.Tasks;
using Tasko.Application.Handlers.Chats.Commands.MarkMessagesRead;
using Tasko.Application.Handlers.Chats.Commands.SendTaskMessage;
using Tasko.Application.Handlers.Chats.Queries.GetTaskMessages;
using Tasko.Application.Handlers.Chats.Queries.GetUnreadCount;
using Tasko.Application.Handlers.Tasks.Commands.AssignOffer;
using Tasko.Application.Handlers.Tasks.Commands.CreateOffer;
using Tasko.Application.Handlers.Tasks.Commands.CreateTask;
using Tasko.Application.Handlers.Tasks.Commands.DeleteTaskImage;
using Tasko.Application.Handlers.Tasks.Commands.PublishTask;
using Tasko.Application.Handlers.Tasks.Commands.UpdateTask;
using Tasko.Application.Handlers.Tasks.Commands.UploadTaskImages;
using Tasko.Application.Handlers.Tasks.Queries.GetTaskById;
using Tasko.Application.Handlers.Tasks.Queries.GetTaskFeed;
using Tasko.Application.Handlers.Tasks.Queries.GetTaskImages;
using Tasko.Application.Handlers.Tasks.Queries.GetTaskOffers;
using Tasko.Application.Handlers.Tasks.Queries.GetTaskStats;
using Tasko.Application.Media;
using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.API.Controllers.Tasks;

[ApiController]
[Route("api/v1/{culture}/tasks")]
[EnableRateLimiting("read")]
public sealed class TasksController : ApiControllerBase
{
    private readonly IOutputCacheStore _cache;

    public TasksController(ISender sender, IOutputCacheStore cache) : base(sender)
    {
        _cache = cache;
    }

    [HttpPost]
    [Authorize]
    [EnableRateLimiting("write")]
    public async Task<ActionResult<TaskDto>> Create([FromBody] CreateTaskCommand command, CancellationToken ct)
    {
        var result = await Sender.Send(command, ct);

        await _cache.EvictByTagAsync("feed", ct);
        await _cache.EvictByTagAsync("tasks", ct);

        return Ok(result);
    }

    [HttpPost("{taskId:long}/publish")]
    [Authorize]
    [EnableRateLimiting("write")]
    public async Task<IActionResult> Publish(long taskId, CancellationToken ct)
    {
        await Sender.Send(new PublishTaskCommand(taskId), ct);

        await _cache.EvictByTagAsync("feed", ct);
        await _cache.EvictByTagAsync("tasks", ct);

        return NoContent();
    }

    [HttpGet("{taskId:long}/messages")]
    [Authorize]
    [EnableRateLimiting("read")]
    public async Task<ActionResult<IReadOnlyList<ChatMessageDto>>> GetMessages(
        [FromRoute] long taskId,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(new GetTaskMessagesQuery(taskId, skip, take), ct));
    }

    [HttpPost("{taskId:long}/offers")]
    [Authorize]
    [EnableRateLimiting("write")]
    public async Task<ActionResult<OfferDto>> CreateOffer(long taskId, [FromBody] CreateOfferBody body, CancellationToken ct)
    {
        var result = await Sender.Send(new CreateOfferCommand(taskId, body.Price, body.Comment), ct);

        await _cache.EvictByTagAsync("feed", ct);
        await _cache.EvictByTagAsync("tasks", ct);

        return Ok(result);
    }

    [HttpPatch("{taskId:long}/update")]
    [Authorize]
    [EnableRateLimiting("write")]
    public async Task<IActionResult> Update([FromRoute] long taskId, [FromBody] UpdateTaskBody body, CancellationToken ct)
    {
        await Sender.Send(new UpdateTaskCommand(
            TaskId: taskId,
            Title: body.Title,
            Description: body.Description,
            Budget: body.Budget,
            CategoryId: body.CategoryId,
            LocationType: body.LocationType
        ), ct);

        await _cache.EvictByTagAsync("feed", ct);
        await _cache.EvictByTagAsync("tasks", ct);

        return NoContent();
    }

    [HttpPost("{taskId:long}/assign/{offerId:long}")]
    [Authorize]
    [EnableRateLimiting("write")]
    public async Task<IActionResult> Assign(long taskId, long offerId, CancellationToken ct)
    {
        await Sender.Send(new AssignOfferCommand(taskId, offerId), ct);

        await _cache.EvictByTagAsync("feed", ct);
        await _cache.EvictByTagAsync("tasks", ct);

        return NoContent();
    }

    [HttpPost("{taskId:long}/messages")]
    [Authorize]
    [EnableRateLimiting("write")]
    public async Task<ActionResult<ChatMessageDto>> SendMessage(
        [FromRoute] long taskId,
        [FromBody] SendMessageBody body,
        CancellationToken ct)
    {
        // messages не кешируем — инвалидация не нужна
        return Ok(await Sender.Send(new SendTaskMessageCommand(taskId, body.Text), ct));
    }

    [HttpGet("{taskId:long}/messages/unread-count")]
    [Authorize]
    [EnableRateLimiting("read")]
    public async Task<ActionResult<UnreadCountDto>> GetUnreadCount([FromRoute] long taskId, CancellationToken ct)
        => Ok(await Sender.Send(new GetUnreadCountQuery(taskId), ct));

    [HttpPatch("{taskId:long}/messages/read")]
    [Authorize]
    [EnableRateLimiting("write")]
    public async Task<IActionResult> MarkRead(
        [FromRoute] long taskId,
        [FromBody] MarkReadBody body,
        CancellationToken ct)
    {
        // unread-count не кешируем — инвалидация не нужна
        await Sender.Send(new MarkMessagesReadCommand(taskId, body.LastReadMessageId), ct);
        return NoContent();
    }

    [HttpGet("{taskId:long}/offers")]
    [Authorize]
    [EnableRateLimiting("read")]
    public async Task<ActionResult<IReadOnlyList<OfferDto>>> GetOffers(
        [FromRoute] long taskId,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50,
        CancellationToken ct = default)
        => Ok(await Sender.Send(new GetTaskOffersQuery(taskId, skip, take), ct));

    [HttpGet("{taskId:long}/stats")]
    [Authorize]
    [EnableRateLimiting("read")]
    public async Task<ActionResult<TaskStatsDto>> GetStats(
        [FromRoute] long taskId,
        CancellationToken ct)
        => Ok(await Sender.Send(new GetTaskStatsQuery(taskId), ct));

    [HttpGet("{taskId:long}")]
    [Authorize] // важно, т.к. vary-by-user и доступ зависит от пользователя
    [EnableRateLimiting("read")]
    [OutputCache(PolicyName = "TaskById5s")]
    public async Task<IActionResult> GetById([FromRoute] long taskId, CancellationToken ct)
    {
        var dto = await Sender.Send(new GetTaskByIdQuery(taskId), ct);
        return Ok(dto);
    }

    [HttpGet("feed")]
    [Authorize]
    [EnableRateLimiting("read")]
    [OutputCache(PolicyName = "Feed10s")]
    public Task<IReadOnlyList<TaskFeedItemDto>> GetFeed(
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50,
        [FromQuery] LocationType? locationType = null,
        CancellationToken ct = default)
        => Sender.Send(new GetTaskFeedQuery(skip, take, locationType), ct);

    public sealed class UploadImagesForm
    {
        public List<IFormFile> Files { get; init; } = new();
    }

    [HttpPost("{taskId:long}/images")]
    [Authorize]
    [Consumes("multipart/form-data")]
    [EnableRateLimiting("upload")]
    public async Task<ActionResult<IReadOnlyList<MediaFileDto>>> UploadImages(
        [FromRoute] long taskId,
        [FromForm] UploadImagesForm form,
        CancellationToken ct)
    {
        if (form.Files.Count == 0)
            return BadRequest("No files provided.");

        var files = form.Files.Select(f => new UploadFile(
            Content: f.OpenReadStream(),
            FileName: f.FileName,
            ContentType: f.ContentType,
            Length: f.Length
        )).ToList();

        var result = await Sender.Send(new UploadTaskImagesCommand(taskId, files), ct);

        await _cache.EvictByTagAsync("images", ct);
        await _cache.EvictByTagAsync("tasks", ct);
        await _cache.EvictByTagAsync("feed", ct);

        return Ok(result);
    }

    [HttpGet("{taskId:long}/images")]
    [Authorize]
    [EnableRateLimiting("read")]
    [OutputCache(PolicyName = "TaskImages30s")]
    public async Task<ActionResult<IReadOnlyList<MediaFileDto>>> GetImages([FromRoute] long taskId, CancellationToken ct)
        => Ok(await Sender.Send(new GetTaskImagesQuery(taskId), ct));

    [HttpDelete("{taskId:long}/images/{fileId:long}")]
    [Authorize]
    [EnableRateLimiting("write")]
    public async Task<IActionResult> DeleteImage([FromRoute] long taskId, [FromRoute] long fileId, CancellationToken ct)
    {
        await Sender.Send(new DeleteTaskImageCommand(taskId, fileId), ct);

        await _cache.EvictByTagAsync("images", ct);
        await _cache.EvictByTagAsync("tasks", ct);
        await _cache.EvictByTagAsync("feed", ct);

        return NoContent();
    }
}
