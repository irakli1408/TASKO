using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Application.DTO.Tasks;

public sealed class TaskFeedItemDto
{
    public long Id { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public decimal? Budget { get; set; }

    public long CategoryId { get; set; }
    public LocationType LocationType { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
