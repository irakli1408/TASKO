using Microsoft.AspNetCore.SignalR;
using Tasko.Application.Abstractions.Realtime;
using Tasko.Application.DTO.Chats;

namespace Tasko.API.Realtime;

public sealed class SignalRChatRealtime : IChatRealtime
{
    private readonly IHubContext<TaskHub> _hub;

    public SignalRChatRealtime(IHubContext<TaskHub> hub)
    {
        _hub = hub;
    }

    public Task MessageReceived(long taskId, ChatMessageDto message, CancellationToken ct)
        => _hub.Clients.Group(TaskHub.GroupName(taskId))
            .SendAsync("MessageReceived", message, ct);

    public Task MessagesRead(long taskId, long userId, long lastReadMessageId, CancellationToken ct)
        => _hub.Clients.Group(TaskHub.GroupName(taskId))
            .SendAsync("MessagesRead", new { taskId, userId, lastReadMessageId }, ct);

    public Task UnreadCountUpdated(long taskId, long userId, int unreadCount, CancellationToken ct)
        => _hub.Clients.Group(TaskHub.GroupName(taskId))
            .SendAsync("UnreadCountUpdated", new { taskId, userId, unreadCount }, ct);
}
