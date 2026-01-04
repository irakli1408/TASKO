namespace Tasko.Application.Abstractions.Auth;

public interface ITokenService
{
    (string Token, DateTime ExpiresAtUtc) CreateAccessToken(long userId, string email, IEnumerable<string> roles);
    (string Token, string TokenHash, DateTime ExpiresAtUtc) CreateRefreshToken();
    string HashRefreshToken(string token);
}
