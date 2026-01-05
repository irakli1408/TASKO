namespace Tasko.Application.Abstractions.Auth;

public interface IPasswordResetTokenService
{
    string CreateToken();                 // raw token (for email link)
    string HashToken(string rawToken);    // hash for DB storage/lookup
}
