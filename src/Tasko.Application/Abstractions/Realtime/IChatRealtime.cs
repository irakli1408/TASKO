using Tasko.Application.DTO.Chats;

namespace Tasko.Application.Abstractions.Realtime;

public interface IChatRealtime
{
    Task MessageReceived(long taskId, ChatMessageDto message, CancellationToken ct);

    Task MessagesRead(long taskId, long userId, long lastReadMessageId, CancellationToken ct);

    Task UnreadCountUpdated(long taskId, long userId, int unreadCount, CancellationToken ct);
}
