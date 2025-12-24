namespace Tasko.Domain.Entities.Chats;

public sealed class ChatMessage
{
    private ChatMessage() { }

    public ChatMessage(long taskId, long senderUserId, string text)
    {
        TaskId = taskId;
        SenderUserId = senderUserId;
        Text = text;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public long Id { get; private set; }

    public long TaskId { get; private set; }
    public long SenderUserId { get; private set; }

    public string Text { get; private set; } = null!;
    public DateTime CreatedAtUtc { get; private set; }
}
