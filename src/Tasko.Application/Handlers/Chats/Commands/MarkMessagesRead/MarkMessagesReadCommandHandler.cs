using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Realtime;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Chats;

namespace Tasko.Application.Handlers.Chats.Commands.MarkMessagesRead;

public sealed class MarkMessagesReadCommandHandler : IRequestHandler<MarkMessagesReadCommand>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;
    private readonly IChatRealtime _realtime;

    public MarkMessagesReadCommandHandler(
        ITaskoDbContext db,
        ICurrentStateService current,
        IChatRealtime realtime)
    {
        _db = db;
        _current = current;
        _realtime = realtime;
    }

    public async Task Handle(MarkMessagesReadCommand request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated)
            throw new UnauthorizedAccessException();

        if (!long.TryParse(_current.UserId, out var userId))
            throw new UnauthorizedAccessException();

        var maxMessageId = await _db.ChatMessages.AsNoTracking()
            .Where(m => m.TaskId == request.TaskId)
            .Select(m => (long?)m.Id)
            .MaxAsync(ct) ?? 0;

        var targetId = Math.Min(request.LastReadMessageId, maxMessageId);
        if (targetId <= 0)
            return;

        var state = await _db.ChatReadStates
            .FirstOrDefaultAsync(x => x.TaskId == request.TaskId && x.UserId == userId, ct);

        if (state is null)
        {
            state = new ChatReadState(request.TaskId, userId, targetId);
            _db.ChatReadStates.Add(state);
        }
        else
        {
            state.MarkReadTo(targetId);
        }

        await _db.SaveChangesAsync(ct);

        await _realtime.MessagesRead(request.TaskId, userId, targetId, ct);

        var unread = await _db.ChatMessages.AsNoTracking()
            .Where(m => m.TaskId == request.TaskId
                        && m.Id > state.LastReadMessageId
                        && m.SenderUserId != userId)
            .CountAsync(ct);

        await _realtime.UnreadCountUpdated(request.TaskId, userId, unread, ct);
    }
}
