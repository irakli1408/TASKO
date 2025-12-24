using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Realtime;
using Tasko.Common.CurrentState;

namespace Tasko.Application.Handlers.Tasks.Commands.PublishTask;

public sealed class PublishTaskCommandHandler : IRequestHandler<PublishTaskCommand>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;
    private readonly ITaskRealtime _realtime;

    public PublishTaskCommandHandler(ITaskoDbContext db, ICurrentStateService current, ITaskRealtime realtime)
    {
        _db = db;
        _current = current;
        _realtime = realtime;
    }

    public async Task Handle(PublishTaskCommand request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
        if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

        var task = await _db.Tasks.FirstOrDefaultAsync(x => x.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Task not found.");

        if (task.CreatedByUserId != userId) throw new UnauthorizedAccessException();

        task.Publish();
        await _db.SaveChangesAsync(ct);

        await _realtime.TaskPublished(task.Id, ct);
    }
}
