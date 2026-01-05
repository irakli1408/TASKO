namespace Tasko.Application.Abstractions.Email;

public interface IEmailSender
{
    Task SendAsync(EmailMessage message, CancellationToken ct);
}

public sealed record EmailMessage(
    string ToEmail,
    string Subject,
    string HtmlBody,
    string? TextBody = null
);
