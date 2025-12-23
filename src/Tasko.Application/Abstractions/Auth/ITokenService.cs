namespace Tasko.Application.Abstractions.Auth
{
    public interface ITokenService
    {
        (string Token, DateTime ExpiresAtUtc) CreateAccessToken(long userId, string email);
        (string Token, string TokenHash, DateTime ExpiresAtUtc) CreateRefreshToken();
        string HashRefreshToken(string token);
    }
}
