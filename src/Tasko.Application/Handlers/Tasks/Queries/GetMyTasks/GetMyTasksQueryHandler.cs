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
            .Select(x => new TaskDto
            {
                Id = x.Id,
                CreatedByUserId = x.CreatedByUserId,
                AssignedToUserId = x.AssignedToUserId,
                Title = x.Title,
                Description = x.Description,
                Budget = x.Budget,
                CategoryId = x.CategoryId,
                LocationType = x.LocationType,
                Status = x.Status.ToString(),
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync(ct);
    }
}
