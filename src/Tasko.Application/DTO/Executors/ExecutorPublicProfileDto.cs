using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Application.DTO.Executors;

public sealed class ExecutorPublicProfileDto
{
    public long Id { get; set; }

    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string? AvatarUrl { get; set; }
    public string? About { get; set; }

    public double RatingAverage { get; set; }
    public int RatingCount { get; set; }

    public LocationType LocationType { get; set; }
    public int? ExperienceYears { get; set; }

    // TODO: later - real categories for executor
    public IReadOnlyList<long> CategoryIds { get; set; } = Array.Empty<long>();
}
