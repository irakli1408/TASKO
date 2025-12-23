using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.Auth;
using Tasko.Common.CurrentState;

namespace Tasko.Application.Handlers.Auth.Queries.Me;

public sealed class MeQueryHandler : IRequestHandler<MeQuery, UserDto>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;

    public MeQueryHandler(ITaskoDbContext db, ICurrentStateService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<UserDto> Handle(MeQuery request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
        if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == userId, ct);
        if (user is null) throw new UnauthorizedAccessException();

        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Phone = user.Phone,
            RoleType = user.RoleType,
            IsExecutorActive = user.IsExecutorActive,
            LocationType = user.LocationType,
            RatingAverage = user.RatingAverage,
            RatingCount = user.RatingCount,
            CreatedAtUtc = user.CreatedAtUtc
        };
    }
}
