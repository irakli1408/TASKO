using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Tasks;

namespace Tasko.Application.Handlers.Tasks.Commands.CompleteTask;

public sealed class CompleteTaskCommandHandler : IRequestHandler<CompleteTaskCommand>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;

    public CompleteTaskCommandHandler(ITaskoDbContext db, ICurrentStateService current)
    {
        _db = db;
        _current = current;
    }

    public async Task Handle(CompleteTaskCommand request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
        if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

        var task = await _db.Tasks.FirstOrDefaultAsync(x => x.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Task not found.");

        if (task.CreatedByUserId != userId) throw new UnauthorizedAccessException();
        if (task.Status != Tasko.Domain.Entities.Tasks.TaskStatus.InProgress) throw new InvalidOperationException("Task is not in progress.");

        task.Complete();
        await _db.SaveChangesAsync(ct);
    }
}
