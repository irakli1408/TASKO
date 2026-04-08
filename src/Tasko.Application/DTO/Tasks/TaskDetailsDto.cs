using Tasko.Application.DTO.Rating;

namespace Tasko.Application.DTO.Tasks;

public sealed class TaskDetailsDto
{
    public long Id { get; set; }
    public long CreatedByUserId { get; set; }
    public long? AssignedToUserId { get; set; }
    public string CreatedByFirstName { get; set; } = string.Empty;
    public string CreatedByLastName { get; set; } = string.Empty;
    public string? AssignedToFirstName { get; set; }
    public string? AssignedToLastName { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal? Budget { get; set; }
    public string? PreferredTime { get; set; }
    public int Status { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public int ViewsCount { get; set; }
    public ReviewDto? Review { get; set; }
}
