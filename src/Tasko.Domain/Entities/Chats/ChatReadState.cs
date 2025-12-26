namespace Tasko.Domain.Entities.Chats;

public sealed class ChatReadState
{
    private ChatReadState() { }

    public ChatReadState(long taskId, long userId, long lastReadMessageId)
    {
        TaskId = taskId;
        UserId = userId;
        LastReadMessageId = lastReadMessageId;
        ReadAtUtc = DateTime.UtcNow;
    }

    public long Id { get; private set; }

    public long TaskId { get; private set; }
    public long UserId { get; private set; }

    public long LastReadMessageId { get; private set; }
    public DateTime ReadAtUtc { get; private set; }

    public void MarkReadTo(long lastReadMessageId)
    {
        if (lastReadMessageId <= LastReadMessageId) return;

        LastReadMessageId = lastReadMessageId;
        ReadAtUtc = DateTime.UtcNow;
    }
}
