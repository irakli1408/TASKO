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
            .Join(
                _db.Users.AsNoTracking(),
                message => message.SenderUserId,
                user => user.Id,
                (message, user) => new { message, user }
            )
            .OrderByDescending(x => x.message.CreatedAtUtc)
            .Skip(skip)
            .Take(take)
            .Select(x => new ChatMessageDto
            {
                Id = x.message.Id,
                TaskId = x.message.TaskId,
                SenderUserId = x.message.SenderUserId,
                SenderFirstName = x.user.FirstName,
                SenderLastName = x.user.LastName,
                Text = x.message.Text,
                CreatedAtUtc = x.message.CreatedAtUtc
            })
            .ToListAsync(ct);

        page.Reverse();
        return page;
    }
}
