using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Application.DTO.Tasks;

public sealed class OfferDto
{
    public long Id { get; init; }
    public long TaskId { get; init; }
    public long ExecutorUserId { get; init; }
    public string ExecutorFirstName { get; init; } = string.Empty;
    public string ExecutorLastName { get; init; } = string.Empty;
    public string? ExecutorAvatarUrl { get; init; }
    public int? ExecutorExperienceYears { get; init; }
    public LocationType ExecutorLocationType { get; init; }
    public double ExecutorRatingAverage { get; init; }
    public int ExecutorRatingCount { get; init; }

    public decimal Price { get; init; }
    public string? Comment { get; init; }

    public string Status { get; init; } = null!;
    public DateTime CreatedAtUtc { get; init; }
}
