using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Realtime;
using Tasko.Common.CurrentState;

namespace Tasko.Application.Handlers.Notifications.Commands.MarkNotificationRead;

public sealed class MarkNotificationReadCommandHandler : IRequestHandler<MarkNotificationReadCommand>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;
    private readonly INotificationRealtime _realtime;

    public MarkNotificationReadCommandHandler(
        ITaskoDbContext db,
        ICurrentStateService current,
        INotificationRealtime realtime)
    {
        _db = db;
        _current = current;
        _realtime = realtime;
    }

    public async Task Handle(MarkNotificationReadCommand request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
        if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

        var n = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == request.NotificationId, ct)
            ?? throw new KeyNotFoundException("Notification not found.");

        if (n.UserId != userId) throw new UnauthorizedAccessException();

        n.MarkRead();
        await _db.SaveChangesAsync(ct);

        // ✅ точечный realtime: это уведомление стало прочитанным
        await _realtime.NotificationRead(userId, n.Id, ct);

        // ✅ обновляем бейдж
        var unread = await _db.Notifications
            .AsNoTracking()
            .CountAsync(x => x.UserId == userId && !x.IsRead, ct);

        await _realtime.UnreadCountChanged(userId, unread, ct);
    }
}
