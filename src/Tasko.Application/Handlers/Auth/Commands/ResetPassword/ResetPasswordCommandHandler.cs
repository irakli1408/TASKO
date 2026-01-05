using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Auth;
using Tasko.Application.Abstractions.Persistence;

namespace Tasko.Application.Handlers.Auth.Commands.ResetPassword;

public sealed class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand>
{
    private readonly ITaskoDbContext _db;
    private readonly IPasswordResetTokenService _tokens;
    private readonly IPasswordHashService _hasher;

    public ResetPasswordCommandHandler(
        ITaskoDbContext db,
        IPasswordResetTokenService tokens,
        IPasswordHashService hasher)
    {
        _db = db;
        _tokens = tokens;
        _hasher = hasher;
    }

    public async Task Handle(ResetPasswordCommand request, CancellationToken ct)
    {
        var rawToken = request.Token?.Trim();
        if (string.IsNullOrWhiteSpace(rawToken))
            throw new InvalidOperationException("Invalid token.");

        var tokenHash = _tokens.HashToken(rawToken);
        var now = DateTime.UtcNow;

        var prt = await _db.PasswordResetTokens
            .FirstOrDefaultAsync(x => x.TokenHash == tokenHash, ct);

        if (prt is null || prt.UsedAtUtc is not null || prt.ExpiresAtUtc <= now)
            throw new InvalidOperationException("Token is invalid or expired.");

        // NOTE: если у тебя DbSet/поле другое — поменяй здесь
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == prt.UserId, ct);
        if (user is null)
            throw new InvalidOperationException("User not found.");

        // NOTE: если поле другое — поменяй здесь
        user.SetPasswordHash(_hasher.Hash(request.NewPassword));

        prt.UsedAtUtc = now;
        await _db.SaveChangesAsync(ct);
    }
}
