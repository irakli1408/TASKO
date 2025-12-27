namespace Tasko.Domain.Entities.Notifications;

public sealed class Notification
{
    private Notification() { }

    public Notification(long userId, NotificationType type, string title, string body, string? dataJson = null)
    {
        UserId = userId;
        Type = type;
        Title = title;
        Body = body;
        DataJson = dataJson;
        IsRead = false;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public long Id { get; private set; }
    public long UserId { get; private set; }

    public NotificationType Type { get; private set; }
    public string Title { get; private set; } = null!;
    public string Body { get; private set; } = null!;

    // хранить например: {"taskId":3,"offerId":15,"executorUserId":20}
    public string? DataJson { get; private set; }

    public bool IsRead { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? ReadAtUtc { get; private set; }

    public void MarkRead()
    {
        if (IsRead) return;
        IsRead = true;
        ReadAtUtc = DateTime.UtcNow;
    }
}
