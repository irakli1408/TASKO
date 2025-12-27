namespace Tasko.Domain.Entities.Tasks;

public sealed class TaskPost
{
    private TaskPost() { }

    public TaskPost(long createdByUserId, string title, string? description, decimal? budget)
    {
        CreatedByUserId = createdByUserId;
        Title = title;
        Description = description;
        Budget = budget;
        Status = TaskStatus.Draft;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public long Id { get; private set; }
    public long CreatedByUserId { get; private set; }
    public long? AssignedToUserId { get; private set; }

    public string Title { get; private set; } = null!;
    public string? Description { get; private set; }
    public decimal? Budget { get; private set; }
    public int ViewsCount { get; private set; }
    public void IncrementViewsCount() => ViewsCount++;

    public TaskStatus Status { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    public void Publish()
    {
        if (Status != TaskStatus.Draft)
            throw new InvalidOperationException("Task is not in Draft.");

        Status = TaskStatus.Published;
    }

    public void Assign(long executorUserId)
    {
        if (Status != TaskStatus.Published)
            throw new InvalidOperationException("Task is not Published.");

        AssignedToUserId = executorUserId;
        Status = TaskStatus.Assigned;
    }
}
