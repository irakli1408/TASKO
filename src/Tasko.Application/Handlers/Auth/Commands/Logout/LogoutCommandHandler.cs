using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Auth;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Common.CurrentState;

namespace Tasko.Application.Handlers.Auth.Commands.Logout;

public sealed class LogoutCommandHandler : IRequestHandler<LogoutCommand, Unit>
{
    private readonly ITaskoDbContext _db;
    private readonly ITokenService _tokens;
    private readonly ICurrentStateService _current;

    public LogoutCommandHandler(ITaskoDbContext db, ITokenService tokens, ICurrentStateService current)
    {
        _db = db;
        _tokens = tokens;
        _current = current;
    }

    public async Task<Unit> Handle(LogoutCommand request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
        if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

        if (string.IsNullOrWhiteSpace(request.RefreshToken))
            return Unit.Value;

        var hash = _tokens.HashRefreshToken(request.RefreshToken);

        var rt = await _db.RefreshTokens.FirstOrDefaultAsync(x => x.TokenHash == hash && x.UserId == userId, ct);
        if (rt is null) return Unit.Value;

        if (!rt.IsRevoked) rt.Revoke();

        await _db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
