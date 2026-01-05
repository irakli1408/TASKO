using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Tasko.Application.Abstractions.Auth;
using Tasko.Application.Settings;

namespace Tasko.Persistence.Auth;

public sealed class PasswordResetTokenService : IPasswordResetTokenService
{
    private readonly PasswordResetOptions _opt;

    public PasswordResetTokenService(IOptions<PasswordResetOptions> opt)
    {
        _opt = opt.Value;
        if (string.IsNullOrWhiteSpace(_opt.Pepper))
            throw new InvalidOperationException("PasswordResetOptions.Pepper is required.");
    }

    public string CreateToken()
    {
        Span<byte> bytes = stackalloc byte[32];
        RandomNumberGenerator.Fill(bytes);
        return Base64UrlEncode(bytes);
    }

    public string HashToken(string rawToken)
    {
        if (string.IsNullOrWhiteSpace(rawToken))
            throw new ArgumentException("Token is empty.", nameof(rawToken));

        var input = rawToken + "|" + _opt.Pepper;
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(hash); // 64 chars
    }

    private static string Base64UrlEncode(ReadOnlySpan<byte> data)
        => Convert.ToBase64String(data)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
}
