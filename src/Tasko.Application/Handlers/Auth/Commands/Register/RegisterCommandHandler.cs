using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Auth;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Common.Auth;
using Tasko.Application.DTO.Auth;
using Tasko.Domain.Entities.Accounts.Users;
using Tasko.Domain.Entities.Auth;

namespace Tasko.Application.Handlers.Auth.Commands.Register;

public sealed class RegisterCommandHandler : IRequestHandler<RegisterCommand, AuthResultDto>
{
    private readonly ITaskoDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly ITokenService _tokens;

    public RegisterCommandHandler(ITaskoDbContext db, IPasswordHasher hasher, ITokenService tokens)
    {
        _db = db;
        _hasher = hasher;
        _tokens = tokens;
    }

    public async Task<AuthResultDto> Handle(RegisterCommand request, CancellationToken ct)
    {
        var email = AuthHelpers.NormalizeEmail(request.Email);
        var phone = (request.Phone ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(email)) throw new InvalidOperationException("Email is required");
        if (string.IsNullOrWhiteSpace(request.Password)) throw new InvalidOperationException("Password is required");
        if (string.IsNullOrWhiteSpace(request.FirstName)) throw new InvalidOperationException("FirstName is required");
        if (string.IsNullOrWhiteSpace(request.LastName)) throw new InvalidOperationException("LastName is required");
        if (string.IsNullOrWhiteSpace(phone)) throw new InvalidOperationException("Phone is required");

        if (await _db.Users.AnyAsync(x => x.Email == email, ct))
            throw new InvalidOperationException("Email already exists");

        if (await _db.Users.AnyAsync(x => x.Phone == phone, ct))
            throw new InvalidOperationException("Phone already exists");

        var user = new User(
            email: email,
            passwordHash: _hasher.Hash(request.Password),
            firstName: request.FirstName.Trim(),
            lastName: request.LastName.Trim(),
            phone: phone
        );

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

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
