namespace Tasko.Application.DTO.Auth;

public sealed class SimpleUserDto
{
    public long Id { get; init; }
    public string FirstName { get; init; } = null!;
    public string LastName { get; init; } = null!;
    public string? AvatarUrl { get; init; }
}
