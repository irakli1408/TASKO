namespace Tasko.Application.DTO.Tasks;


public sealed class TaskDto
{
    public long Id { get; init; }
    public long CreatedByUserId { get; init; }
    public long? AssignedToUserId { get; init; }
    public string? AssignedToFirstName { get; init; }
    public string? AssignedToLastName { get; init; }

    public string Title { get; init; } = null!;
    public string? Description { get; init; }
    public decimal? Budget { get; init; }
    public string? PreferredTime { get; init; }
    public long CategoryId { get; init; }
    public Tasko.Domain.Entities.Accounts.Users.LocationType LocationType { get; init; }
    public string Status { get; init; } = null!;
    public DateTime CreatedAtUtc { get; init; }
}
