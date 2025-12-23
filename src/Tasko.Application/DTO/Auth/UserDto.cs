using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Application.DTO.Auth;

public sealed class UserDto
{
    public long Id { get; init; }

    public string Email { get; init; } = null!;
    public string FirstName { get; init; } = null!;
    public string LastName { get; init; } = null!;
    public string Phone { get; init; } = null!;

    public UserRoleType RoleType { get; init; }
    public bool IsExecutorActive { get; init; }

    public LocationType LocationType { get; init; }

    public double RatingAverage { get; init; }
    public int RatingCount { get; init; }

    public DateTime CreatedAtUtc { get; init; }
}
