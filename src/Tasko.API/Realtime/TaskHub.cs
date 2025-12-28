using Microsoft.AspNetCore.Authorization;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;
using System.Security.Claims;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Realtime;
using Tasko.Application.Handlers.Chats.Commands.SendTaskMessage;

namespace Tasko.API.Realtime;

[Authorize]
public sealed class TaskHub : Hub
{
    private readonly ITaskoDbContext _db;
    private readonly ISender _sender;
    private readonly IChatPresence _presence;

    // анти-спам по событиям "печатает"
    private static readonly ConcurrentDictionary<string, DateTime> _typingThrottle = new();

    // какие taskId открыты у connection (для auto-stop typing)
    private static readonly ConcurrentDictionary<string, HashSet<long>> _joinedTasks = new();

    public TaskHub(ITaskoDbContext db, ISender sender, IChatPresence presence)
    {
        _db = db;
        _sender = sender;
        _presence = presence;
    }

    public static string GroupName(long taskId) => $"task-{taskId}";

    public async Task JoinTask(long taskId)
    {
        var userIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userIdStr) || !long.TryParse(userIdStr, out var userId))
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

        var set = _joinedTasks.GetOrAdd(Context.ConnectionId, _ => new HashSet<long>());
        lock (set) set.Add(taskId);

        // ✅ ВАЖНО ДЛЯ MUTE
        _presence.JoinTask(userId, taskId, Context.ConnectionId);
    }

    // ✅ Добавь этот метод (твой тест его вызывает)
    public async Task LeaveTask(long taskId)
    {
        var userIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userIdStr) || !long.TryParse(userIdStr, out var userId))
            throw new HubException("Unauthorized");

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(taskId));

        if (_joinedTasks.TryGetValue(Context.ConnectionId, out var set))
        {
            lock (set)
            {
                set.Remove(taskId);
                if (set.Count == 0)
                    _joinedTasks.TryRemove(Context.ConnectionId, out _);
            }
        }

        // ✅ ВАЖНО ДЛЯ MUTE
        _presence.LeaveTask(userId, taskId, Context.ConnectionId);
    }

    public async Task SendMessage(long taskId, string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return;

        await _sender.Send(new SendTaskMessageCommand(taskId, text.Trim()));
    }

    public async Task TypingStart(long taskId)
    {
        var userIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = string.IsNullOrWhiteSpace(userIdStr) ? "unknown" : userIdStr;

        var key = $"{taskId}:{Context.ConnectionId}:{userId}";
        var now = DateTime.UtcNow;

        if (_typingThrottle.TryGetValue(key, out var last) && (now - last).TotalMilliseconds < 1200)
            return;

        _typingThrottle[key] = now;

        await Clients.OthersInGroup(GroupName(taskId))
            .SendAsync("UserTyping", new { taskId, userId, isTyping = true, atUtc = now });
    }

    public async Task TypingStop(long taskId)
    {
        var userIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = string.IsNullOrWhiteSpace(userIdStr) ? "unknown" : userIdStr;

        var now = DateTime.UtcNow;

        await Clients.OthersInGroup(GroupName(taskId))
            .SendAsync("UserTyping", new { taskId, userId, isTyping = false, atUtc = now });
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // ✅ ВАЖНО ДЛЯ MUTE
        _presence.Disconnect(Context.ConnectionId);

        var userIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = string.IsNullOrWhiteSpace(userIdStr) ? "unknown" : userIdStr;

        if (_joinedTasks.TryRemove(Context.ConnectionId, out var taskIds))
        {
            var now = DateTime.UtcNow;

            foreach (var taskId in taskIds)
            {
                await Clients.OthersInGroup(GroupName(taskId))
                    .SendAsync("UserTyping", new { taskId, userId, isTyping = false, atUtc = now });
            }
        }

        await base.OnDisconnectedAsync(exception);
    }
}
