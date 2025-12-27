using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Realtime;
using Tasko.Common.CurrentState;

namespace Tasko.Application.Handlers.Notifications.Commands.ReadAllNotifications;

public sealed class ReadAllNotificationsCommandHandler : IRequestHandler<ReadAllNotificationsCommand>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;
    private readonly INotificationRealtime _realtime;

    public ReadAllNotificationsCommandHandler(
        ITaskoDbContext db,
        ICurrentStateService current,
        INotificationRealtime realtime)
    {
        _db = db;
        _current = current;
        _realtime = realtime;
    }

    public async Task Handle(ReadAllNotificationsCommand request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
        if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

        // читаем всё одним UPDATE (без загрузки сущностей)
        await _db.Notifications
            .Where(x => x.UserId == userId && !x.IsRead)
            .ExecuteUpdateAsync(s => s
                .SetProperty(x => x.IsRead, true)
                .SetProperty(x => x.ReadAtUtc, DateTime.UtcNow), ct);

        // unread-count после read-all = 0, но пересчитаем честно
        var unread = await _db.Notifications
            .AsNoTracking()
            .CountAsync(x => x.UserId == userId && !x.IsRead, ct);

        await _realtime.UnreadCountChanged(userId, unread, ct);
    }
}
