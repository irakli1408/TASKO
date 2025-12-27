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

        await _db.Notifications
            .Where(x => x.UserId == userId && !x.IsRead)
            .ExecuteUpdateAsync(s => s
                .SetProperty(x => x.IsRead, true)
                .SetProperty(x => x.ReadAtUtc, DateTime.UtcNow), ct);

        // ✅ realtime: отметить весь список прочитанным
        await _realtime.NotificationsReadAll(userId, ct);

        // ✅ realtime: обновить бейдж
        var unread = await _db.Notifications
            .AsNoTracking()
            .CountAsync(x => x.UserId == userId && !x.IsRead, ct);

        await _realtime.UnreadCountChanged(userId, unread, ct);
    }
}
