namespace Tasko.Application.DTO.Auth;

public sealed class AuthResultDto
{
    public string AccessToken { get; init; } = null!;
    public DateTime AccessTokenExpiresAtUtc { get; init; }
    public string RefreshToken { get; init; } = null!;
}
