namespace Tasko.Application.DTO.Tasks;

public sealed class MyJobListItemDto
{
    public long TaskId { get; init; }

    public string TaskTitle { get; init; } = string.Empty;
    public string? TaskDescription { get; init; }

    public decimal? Budget { get; init; }
    public string? PreferredTime { get; init; }
    public string Status { get; init; } = string.Empty;

    public long CategoryId { get; init; }
    public string CategoryName { get; init; } = string.Empty;

    public int LocationType { get; init; }
    public string CustomerName { get; init; } = string.Empty;

    public DateTime StartedAtUtc { get; init; }
}
