using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Services;
using Tasko.Application.DTO.Tasks;
using Tasko.Common.CurrentState;

namespace Tasko.Application.Handlers.Tasks.Queries.GetTaskById;

public sealed class GetTaskByIdQueryHandler : IRequestHandler<GetTaskByIdQuery, TaskDetailsDto>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;
    private readonly ITaskViewService _views;

    public GetTaskByIdQueryHandler(ITaskoDbContext db, ICurrentStateService current, ITaskViewService views)
    {
        _db = db;
        _current = current;
        _views = views;
    }

    public async Task<TaskDetailsDto> Handle(GetTaskByIdQuery request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated)
            throw new UnauthorizedAccessException();

        if (!long.TryParse(_current.UserId, out var userId))
            throw new UnauthorizedAccessException();

        // 1) load task (no tracking, cheap)
        var task = await _db.Tasks
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Task not found.");

        // 2) access rules (same as chat)
        var isCreator = task.CreatedByUserId == userId;
        var isAssigned = task.AssignedToUserId == userId;

        var hasOffer = await _db.Offers
            .AsNoTracking()
            .AnyAsync(x => x.TaskId == task.Id && x.ExecutorUserId == userId, ct);

        if (!isCreator && !isAssigned && !hasOffer)
            throw new UnauthorizedAccessException("Access denied.");

        // 3) track unique view (service already ignores owner)
        await _views.TrackTaskViewAsync(task.Id, userId, ct);

        // 4) get fresh ViewsCount after increment
        var viewsCount = await _db.Tasks
            .AsNoTracking()
            .Where(x => x.Id == task.Id)
            .Select(x => x.ViewsCount)
            .FirstAsync(ct);

        return new TaskDetailsDto
        {
            Id = task.Id,
            CreatedByUserId = task.CreatedByUserId,
            AssignedToUserId = task.AssignedToUserId,

            Title = task.Title,
            Description = task.Description,
            Budget = task.Budget,

            // if Status is enum, cast; if int, replace with task.Status
            Status = (int)task.Status,

            CreatedAtUtc = task.CreatedAtUtc,
            ViewsCount = viewsCount
        };
    }
}
