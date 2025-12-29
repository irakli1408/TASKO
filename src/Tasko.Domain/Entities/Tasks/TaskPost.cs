using Tasko.Domain.Entities.Accounts.Users;
using Tasko.Domain.Entities.Categories;

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
    public long CategoryId { get; private set; }
    public Category Category { get; private set; } = null!;
    public LocationType LocationType { get; private set; } = LocationType.AllCity;

    public void SetLocation(LocationType location) => LocationType = location;

    public void SetCategory(long categoryId)
    {
        if (categoryId <= 0)
            throw new ArgumentOutOfRangeException(nameof(categoryId));

        CategoryId = categoryId;
    }
    public void Publish()
    {
        if (Status != TaskStatus.Draft)
            throw new InvalidOperationException("Task is not in Draft.");

        Status = TaskStatus.Published;
    }

    public void UpdateDraft(string? title = null, string? description = null, decimal? budget = null)
    {
        if (Status != TaskStatus.Draft)
            throw new InvalidOperationException("Task cannot be edited after publish.");

        if (title is not null)
        {
            var t = title.Trim();
            if (string.IsNullOrWhiteSpace(t))
                throw new ArgumentException("Title is required.", nameof(title));

            Title = t;
        }

        if (description is not null)
            Description = description.Trim();

        if (budget is not null)
        {
            if (budget.Value < 0)
                throw new ArgumentOutOfRangeException(nameof(budget));

            Budget = budget;
        }
    }

    public void Assign(long executorUserId)
    {
        if (Status != TaskStatus.Published)
            throw new InvalidOperationException("Task is not Published.");

        AssignedToUserId = executorUserId;
        Status = TaskStatus.Assigned;
    }
}
