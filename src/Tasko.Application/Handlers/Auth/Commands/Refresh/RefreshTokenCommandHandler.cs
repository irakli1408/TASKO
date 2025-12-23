using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Auth;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.Auth;
using Tasko.Domain.Entities.Auth;

namespace Tasko.Application.Handlers.Auth.Commands.Refresh;

public sealed class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResultDto>
{
    private readonly ITaskoDbContext _db;
    private readonly ITokenService _tokens;

    public RefreshTokenCommandHandler(ITaskoDbContext db, ITokenService tokens)
    {
        _db = db;
        _tokens = tokens;
    }

    public async Task<AuthResultDto> Handle(RefreshTokenCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
            throw new UnauthorizedAccessException();

        var hash = _tokens.HashRefreshToken(request.RefreshToken);

        var rt = await _db.RefreshTokens.FirstOrDefaultAsync(x => x.TokenHash == hash, ct);
        if (rt is null || rt.IsRevoked || rt.ExpiresAtUtc <= DateTime.UtcNow)
            throw new UnauthorizedAccessException();

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == rt.UserId, ct);
        if (user is null || !user.IsActive)
            throw new UnauthorizedAccessException();

        rt.Revoke();

        var (access, accessExp) = _tokens.CreateAccessToken(user.Id, user.Email);
        var (refresh, refreshHash, refreshExp) = _tokens.CreateRefreshToken();

        _db.RefreshTokens.Add(new RefreshToken(user.Id, refreshHash, refreshExp));
        await _db.SaveChangesAsync(ct);

        return new AuthResultDto
        {
            AccessToken = access,
            AccessTokenExpiresAtUtc = accessExp,
            RefreshToken = refresh
        };
    }
}
