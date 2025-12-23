namespace Tasko.Application.Common.Auth;

internal static class AuthHelpers
{
    internal static string NormalizeEmail(string email)
        => (email ?? string.Empty).Trim().ToLowerInvariant();
}
