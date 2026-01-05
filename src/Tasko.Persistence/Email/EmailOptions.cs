namespace Tasko.Persistence.Email;

public sealed class EmailOptions
{
    public string Host { get; init; } = default!;
    public int Port { get; init; } = 587;

    // If false -> uses StartTls by default in sender
    public bool UseSsl { get; init; } = false;

    public string Username { get; init; } = default!;
    public string Password { get; init; } = default!;

    public string FromEmail { get; init; } = default!;
    public string FromName { get; init; } = "Tasko";
}
