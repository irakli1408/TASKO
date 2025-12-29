using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Application.DTO.Profile;

public sealed class MyProfileDto
{
    public long Id { get; set; }
    public string Email { get; set; } = null!;

    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public string? AvatarUrl { get; set; }
    public string? About { get; set; }

    public UserRoleType RoleType { get; set; }
    public bool IsExecutorActive { get; set; }
    public LocationType LocationType { get; set; }
    public List<int> ExecutorLocationTypes { get; set; } = new();
    public double RatingAverage { get; set; }
    public int RatingCount { get; set; }

    public ExecutorSectionDto? Executor { get; set; }
}

public sealed class ExecutorSectionDto
{
    public int? ExperienceYears { get; set; }
}
