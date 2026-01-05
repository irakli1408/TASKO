using System.Security.Cryptography;
using Tasko.Application.Abstractions.Auth;

namespace Tasko.Persistence.Auth;

public sealed class Pbkdf2PasswordHashService : IPasswordHashService
{
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const int Iterations = 100_000;

    public string Hash(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
            throw new ArgumentException("Password is empty.", nameof(password));

        Span<byte> salt = stackalloc byte[SaltSize];
        RandomNumberGenerator.Fill(salt);

        var key = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt.ToArray(),
            Iterations,
            HashAlgorithmName.SHA256,
            KeySize);

        return $"PBKDF2";
    }

    public bool Verify(string hashedPassword, string providedPassword)
    {
        if (string.IsNullOrWhiteSpace(hashedPassword) || string.IsNullOrWhiteSpace(providedPassword))
            return false;

        var parts = hashedPassword.Split('$');
        if (parts.Length != 5) return false;
        if (!string.Equals(parts[0], "PBKDF2", StringComparison.Ordinal) ||
            !string.Equals(parts[1], "V1", StringComparison.Ordinal))
            return false;

        if (!int.TryParse(parts[2], out var iter)) return false;

        byte[] salt, expectedKey;
        try { salt = Convert.FromBase64String(parts[3]); expectedKey = Convert.FromBase64String(parts[4]); }
        catch { return false; }

        var actualKey = Rfc2898DeriveBytes.Pbkdf2(
            providedPassword,
            salt,
            iter,
            HashAlgorithmName.SHA256,
            expectedKey.Length);

        return CryptographicOperations.FixedTimeEquals(actualKey, expectedKey);
    }
}
