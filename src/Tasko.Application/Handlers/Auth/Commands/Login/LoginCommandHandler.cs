using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Auth;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Common.Auth;
using Tasko.Application.DTO.Auth;
using Tasko.Domain.Entities.Auth;

namespace Tasko.Application.Handlers.Auth.Commands.Login;

public sealed class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResultDto>
{
    private readonly ITaskoDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly ITokenService _tokens;

    public LoginCommandHandler(ITaskoDbContext db, IPasswordHasher hasher, ITokenService tokens)
    {
        _db = db;
        _hasher = hasher;
        _tokens = tokens;
    }

    public async Task<AuthResultDto> Handle(LoginCommand request, CancellationToken ct)
    {
        var email = AuthHelpers.NormalizeEmail(request.Email);
        if (string.IsNullOrWhiteSpace(email)) throw new UnauthorizedAccessException();

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == email, ct);
        if (user is null || !user.IsActive) throw new UnauthorizedAccessException();

        if (!_hasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException();

        user.UpdateLastOnline();

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
