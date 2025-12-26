using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Handlers.Chats.Commands.SendTaskMessage;

namespace Tasko.API.Realtime;

[Authorize]
public sealed class TaskHub : Hub
{
    private readonly ITaskoDbContext _db;
    private readonly ISender _sender;

    public TaskHub(ITaskoDbContext db, ISender sender)
    {
        _db = db;
        _sender = sender;
    }

    public static string GroupName(long taskId) => $"task-{taskId}";

    private bool TryGetUserId(out long userId)
    {
        userId = 0;
        var userIdStr =
            Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? Context.User?.FindFirstValue("sub");

        return !string.IsNullOrWhiteSpace(userIdStr) && long.TryParse(userIdStr, out userId);
    }

    public async Task JoinTask(long taskId)
    {
        if (!TryGetUserId(out var userId))
            throw new HubException("Unauthorized");

        var task = await _db.Tasks.AsNoTracking().FirstOrDefaultAsync(x => x.Id == taskId);
        if (task is null)
            throw new HubException("Task not found.");

        var isCreator = task.CreatedByUserId == userId;
        var isAssigned = task.AssignedToUserId == userId;
        var hasOffer = await _db.Offers.AsNoTracking()
            .AnyAsync(x => x.TaskId == taskId && x.ExecutorUserId == userId);

        if (!isCreator && !isAssigned && !hasOffer)
            throw new HubException("Access denied.");

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(taskId));
    }

    // Опционально: оставить для совместимости, но без записи в БД тут!
    public async Task SendMessage(long taskId, string text)
    {
        // Handler сам сохранит и сам разошлёт MessageReceived
        await _sender.Send(new SendTaskMessageCommand(taskId, text), CancellationToken.None);
    }
}
