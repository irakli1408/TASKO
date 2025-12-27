using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Common.CurrentState;

namespace Tasko.Application.Handlers.Notifications.Commands.MarkNotificationRead;

public sealed class MarkNotificationReadCommandHandler : IRequestHandler<MarkNotificationReadCommand>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;

    public MarkNotificationReadCommandHandler(ITaskoDbContext db, ICurrentStateService current)
    {
        _db = db;
        _current = current;
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
    }
}
