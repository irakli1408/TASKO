using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using Tasko.Application.Abstractions.Email;

namespace Tasko.Persistence.Email;

public sealed class SmtpEmailSender : IEmailSender
{
    private readonly EmailOptions _opt;

    public SmtpEmailSender(IOptions<EmailOptions> opt)
    {
        _opt = opt.Value;
    }

    public async Task SendAsync(EmailMessage message, CancellationToken ct)
    {
        var email = new MimeMessage();
        email.From.Add(new MailboxAddress(_opt.FromName, _opt.FromEmail));
        email.To.Add(MailboxAddress.Parse(message.ToEmail));
        email.Subject = message.Subject;

        var body = new BodyBuilder
        {
            HtmlBody = message.HtmlBody,
            TextBody = message.TextBody
        };

        email.Body = body.ToMessageBody();

        using var client = new SmtpClient();

        var secure = _opt.UseSsl
            ? SecureSocketOptions.SslOnConnect
            : SecureSocketOptions.StartTls;

        await client.ConnectAsync(_opt.Host, _opt.Port, secure, ct);
        await client.AuthenticateAsync(_opt.Username, _opt.Password, ct);
        await client.SendAsync(email, ct);
        await client.DisconnectAsync(true, ct);
    }
}
