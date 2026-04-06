using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.Tasks;
using Tasko.Common.CurrentState;

namespace Tasko.Application.Handlers.Tasks.Queries.GetMyTasks;

public sealed class GetMyTasksQueryHandler : IRequestHandler<GetMyTasksQuery, IReadOnlyList<TaskDto>>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;

    public GetMyTasksQueryHandler(ITaskoDbContext db, ICurrentStateService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<IReadOnlyList<TaskDto>> Handle(GetMyTasksQuery request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated)
            throw new UnauthorizedAccessException();

        if (!long.TryParse(_current.UserId, out var userId))
            throw new UnauthorizedAccessException();

        var skip = Math.Max(0, request.Skip);
        var take = Math.Clamp(request.Take, 1, 100);

        return await _db.Tasks
            .AsNoTracking()
            .Where(x => x.CreatedByUserId == userId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip(skip)
            .Take(take)
            .GroupJoin(
                _db.Users.AsNoTracking(),
                task => task.AssignedToUserId,
                user => user.Id,
                (task, users) => new { task, assigned = users.FirstOrDefault() })
            .Select(x => new TaskDto
            {
                Id = x.task.Id,
                CreatedByUserId = x.task.CreatedByUserId,
                AssignedToUserId = x.task.AssignedToUserId,
                AssignedToFirstName = x.assigned != null ? x.assigned.FirstName : null,
                AssignedToLastName = x.assigned != null ? x.assigned.LastName : null,
                Title = x.task.Title,
                Description = x.task.Description,
                Budget = x.task.Budget,
                CategoryId = x.task.CategoryId,
                LocationType = x.task.LocationType,
                Status = x.task.Status.ToString(),
                CreatedAtUtc = x.task.CreatedAtUtc
            })
            .ToListAsync(ct);
    }
}
