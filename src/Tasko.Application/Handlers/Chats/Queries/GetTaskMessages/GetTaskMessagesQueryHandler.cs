using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.Chats;

namespace Tasko.Application.Handlers.Chats.Queries.GetTaskMessages;

public sealed class GetTaskMessagesQueryHandler : IRequestHandler<GetTaskMessagesQuery, IReadOnlyList<ChatMessageDto>>
{
    private readonly ITaskoDbContext _db;

    public GetTaskMessagesQueryHandler(ITaskoDbContext db) => _db = db;

    public async Task<IReadOnlyList<ChatMessageDto>> Handle(GetTaskMessagesQuery request, CancellationToken ct)
    {
        var take = Math.Clamp(request.Take, 1, 200);
        var skip = Math.Max(0, request.Skip);

        // Return oldest -> newest for UI convenience
        var page = await _db.ChatMessages
            .AsNoTracking()
            .Where(x => x.TaskId == request.TaskId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip(skip)
            .Take(take)
            .Select(x => new ChatMessageDto
            {
                Id = x.Id,
                TaskId = x.TaskId,
                SenderUserId = x.SenderUserId,
                Text = x.Text,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync(ct);

        page.Reverse();
        return page;
    }
}
