using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.Chats;
using Tasko.Common.CurrentState;

namespace Tasko.Application.Handlers.Chats.Queries.GetUnreadCount;

public sealed class GetUnreadCountQueryHandler : IRequestHandler<GetUnreadCountQuery, UnreadCountDto>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;

    public GetUnreadCountQueryHandler(ITaskoDbContext db, ICurrentStateService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<UnreadCountDto> Handle(GetUnreadCountQuery request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
        if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

        var lastReadId = await _db.ChatReadStates.AsNoTracking()
            .Where(x => x.TaskId == request.TaskId && x.UserId == userId)
            .Select(x => (long?)x.LastReadMessageId)
            .FirstOrDefaultAsync(ct) ?? 0;

        var count = await _db.ChatMessages.AsNoTracking()
            .Where(m => m.TaskId == request.TaskId
                        && m.Id > lastReadId
                        && m.SenderUserId != userId)
            .CountAsync(ct);

        return new UnreadCountDto { Count = count };
    }
}
