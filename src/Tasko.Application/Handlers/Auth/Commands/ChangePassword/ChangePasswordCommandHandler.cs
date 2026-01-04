using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Auth;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Common.CurrentState;

namespace Tasko.Application.Handlers.Auth.Commands.ChangePassword;

public sealed class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand>
{
    private readonly ITaskoDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly ICurrentStateService _current;

    public ChangePasswordCommandHandler(
        ITaskoDbContext db,
        IPasswordHasher hasher,
        ICurrentStateService current)
    {
        _db = db;
        _hasher = hasher;
        _current = current;
    }

    public async Task Handle(ChangePasswordCommand request, CancellationToken ct)
    {
        // 1) Берём userId как string? и валидируем
        var userIdStr = _current.UserId;
        if (string.IsNullOrWhiteSpace(userIdStr) || !long.TryParse(userIdStr, out var userId))
            throw new UnauthorizedAccessException();

        // 2) Достаём юзера по long id
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == userId, ct);
        if (user is null || !user.IsActive)
            throw new UnauthorizedAccessException();

        // 3) Проверяем текущий пароль
        if (!_hasher.Verify(request.CurrentPassword, user.PasswordHash))
            throw new UnauthorizedAccessException();

        // 4) Ставим новый пароль
        user.SetPasswordHash(_hasher.Hash(request.NewPassword));

        // 5) Инвалидируем ВСЕ refresh-токены пользователя
        await _db.RefreshTokens
            .Where(x => x.UserId == userId)   // <- тут теперь long, если в БД тоже long
            .ExecuteDeleteAsync(ct);

        await _db.SaveChangesAsync(ct);
    }
}
