using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Common.CurrentState;

namespace Tasko.Application.Handlers.Notifications.Queries.GetMyNotifications;

public sealed class GetMyNotificationsQueryHandler : IRequestHandler<GetMyNotificationsQuery, IReadOnlyList<MyNotificationDto>>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;

    public GetMyNotificationsQueryHandler(ITaskoDbContext db, ICurrentStateService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<IReadOnlyList<MyNotificationDto>> Handle(GetMyNotificationsQuery request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
        if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

        var take = Math.Clamp(request.Take, 1, 200);
        var skip = Math.Max(0, request.Skip);

        return await _db.Notifications
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip(skip)
            .Take(take)
            .Select(x => new MyNotificationDto
            {
                Id = x.Id,
                Type = x.Type,
                Title = x.Title,
                Body = x.Body,
                DataJson = x.DataJson,
                IsRead = x.IsRead,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync(ct);
    }
}
