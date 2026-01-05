using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Tasko.Application.Abstractions.Auth;
using Tasko.Application.Abstractions.Email;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Settings;
using Tasko.Domain.Entities.Auth;

namespace Tasko.Application.Handlers.Auth.Commands.ForgotPassword;

public sealed class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand>
{
    private readonly ITaskoDbContext _db;
    private readonly IEmailSender _email;
    private readonly IPasswordResetTokenService _tokens;
    private readonly PasswordResetOptions _opt;
    private readonly IConfiguration _cfg;

    public ForgotPasswordCommandHandler(
        ITaskoDbContext db,
        IEmailSender email,
        IPasswordResetTokenService tokens,
        IOptions<PasswordResetOptions> opt,
        IConfiguration cfg)
    {
        _db = db;
        _email = email;
        _tokens = tokens;
        _opt = opt.Value;
        _cfg = cfg;
    }

    public async Task Handle(ForgotPasswordCommand request, CancellationToken ct)
    {
        var email = (request.Email ?? string.Empty).Trim().ToLowerInvariant();

        // NOTE: если у тебя DbSet/поле другое — поменяй здесь
        var user = await _db.Users
            .AsNoTracking()
            .Where(x => x.Email.ToLower() == email)
            .Select(x => new { x.Id, x.Email })
            .FirstOrDefaultAsync(ct);

        if (user is null) return;

        var rawToken = _tokens.CreateToken();
        var tokenHash = _tokens.HashToken(rawToken);

        var now = DateTime.UtcNow;

        var entity = new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = tokenHash,
            CreatedAtUtc = now,
            ExpiresAtUtc = now.AddMinutes(_opt.ExpiresMinutes),
            RequestedIp = null,
            UserAgent = null
        };

        _db.PasswordResetTokens.Add(entity);
        await _db.SaveChangesAsync(ct);

        var baseUrl = (_cfg["Frontend:BaseUrl"] ?? "").Trim().TrimEnd('/');
        if (string.IsNullOrWhiteSpace(baseUrl))
            baseUrl = "https://your-frontend-domain.com";

        var resetUrl = $"{baseUrl}/reset-password?token={Uri.EscapeDataString(rawToken)}";

        var subject = "Tasko: Reset your password";
        var html = $@"
<div style=""font-family:Arial,sans-serif;font-size:14px;line-height:1.5"">
  <h2 style=""margin:0 0 12px 0"">Reset password</h2>
  <p>We received a request to reset your password.</p>
  <p><a href=""{resetUrl}"" style=""display:inline-block;padding:10px 14px;text-decoration:none;border-radius:6px;border:1px solid #333"">
     Reset password</a></p>
  <p style=""color:#666"">This link will expire in {_opt.ExpiresMinutes} minutes.</p>
</div>";

        var text = $"Reset password: {resetUrl}\nExpires in {_opt.ExpiresMinutes} minutes.";

        await _email.SendAsync(new EmailMessage(user.Email, subject, html, text), ct);
    }
}
