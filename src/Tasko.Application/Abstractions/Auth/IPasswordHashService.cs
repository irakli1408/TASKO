namespace Tasko.Application.Abstractions.Auth;

public interface IPasswordHashService
{
    string Hash(string password);
    bool Verify(string hashedPassword, string providedPassword);
}
