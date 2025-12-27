namespace Tasko.Domain.Entities.Tasks;

public sealed class TaskView
{
    private TaskView() { }

    public TaskView(long taskId, long viewerUserId)
    {
        TaskId = taskId;
        ViewerUserId = viewerUserId;
        ViewedAtUtc = DateTime.UtcNow;
    }

    public long Id { get; private set; }

    public long TaskId { get; private set; }
    public TaskPost Task { get; private set; } = null!;

    public long ViewerUserId { get; private set; }
    public DateTime ViewedAtUtc { get; private set; }
}
