namespace Tasko.Application.Settings;

public sealed class PasswordResetOptions
{
    public int ExpiresMinutes { get; init; } = 30;

    // Secret "pepper" for hashing reset tokens (store in appsettings/user-secrets).
    public string Pepper { get; init; } = default!;
}
