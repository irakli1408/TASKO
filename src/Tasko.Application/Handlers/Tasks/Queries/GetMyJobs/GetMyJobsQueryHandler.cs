using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.Tasks;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Tasks;

namespace Tasko.Application.Handlers.Tasks.Queries.GetMyJobs;

public sealed class GetMyJobsQueryHandler : IRequestHandler<GetMyJobsQuery, IReadOnlyList<MyJobListItemDto>>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;

    public GetMyJobsQueryHandler(ITaskoDbContext db, ICurrentStateService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<IReadOnlyList<MyJobListItemDto>> Handle(GetMyJobsQuery request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated)
            throw new UnauthorizedAccessException();

        if (!long.TryParse(_current.UserId, out var userId))
            throw new UnauthorizedAccessException();

        var take = Math.Clamp(request.Take, 1, 100);
        var skip = Math.Max(0, request.Skip);

        var allowedStatuses = new[]
        {
            Tasko.Domain.Entities.Tasks.TaskStatus.Assigned,
            Tasko.Domain.Entities.Tasks.TaskStatus.InProgress,
            Tasko.Domain.Entities.Tasks.TaskStatus.Completed
        };

        var items = await _db.Tasks
            .AsNoTracking()
            .Where(x => x.AssignedToUserId == userId && allowedStatuses.Contains(x.Status))
            .OrderByDescending(x => x.PublishedAtUtc ?? x.CreatedAtUtc)
            .Skip(skip)
            .Take(take)
            .Join(
                _db.Categories.AsNoTracking(),
                task => task.CategoryId,
                category => category.Id,
                (task, category) => new { task, category }
            )
            .Join(
                _db.Users.AsNoTracking(),
                x => x.task.CreatedByUserId,
                user => user.Id,
                (x, user) => new MyJobListItemDto
                {
                    TaskId = x.task.Id,
                    TaskTitle = x.task.Title,
                    TaskDescription = x.task.Description,
                    Budget = x.task.Budget,
                    PreferredTime = x.task.PreferredTime,
                    Status = x.task.Status.ToString(),
                    CategoryId = x.category.Id,
                    CategoryName = x.category.Name,
                    LocationType = (int)x.task.LocationType,
                    CustomerName = $"{user.FirstName} {user.LastName}".Trim(),
                    AssignedAtUtc = x.task.AssignedAtUtc,
                    StartedAtUtc = x.task.StartedAtUtc,
                    CompletedAtUtc = x.task.CompletedAtUtc
                }
            )
            .ToListAsync(ct);

        return items;
    }
}
