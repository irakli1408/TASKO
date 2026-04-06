using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Tasks;

namespace Tasko.Application.Handlers.Tasks.Commands.StartTaskProgress;

public sealed class StartTaskProgressCommandHandler : IRequestHandler<StartTaskProgressCommand>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;

    public StartTaskProgressCommandHandler(ITaskoDbContext db, ICurrentStateService current)
    {
        _db = db;
        _current = current;
    }

    public async Task Handle(StartTaskProgressCommand request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
        if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

        var task = await _db.Tasks.FirstOrDefaultAsync(x => x.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Task not found.");

        if (task.AssignedToUserId != userId) throw new UnauthorizedAccessException();
        if (task.Status != Tasko.Domain.Entities.Tasks.TaskStatus.Assigned) throw new InvalidOperationException("Task is not assigned yet.");

        task.StartProgress();
        await _db.SaveChangesAsync(ct);
    }
}
