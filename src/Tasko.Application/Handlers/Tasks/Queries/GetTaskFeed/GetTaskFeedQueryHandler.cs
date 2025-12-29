using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.Tasks;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Accounts.Users;
using Tasko.Domain.Entities.Tasks;

namespace Tasko.Application.Handlers.Tasks.Queries.GetTaskFeed;

public sealed class GetTaskFeedQueryHandler
    : IRequestHandler<GetTaskFeedQuery, IReadOnlyList<TaskFeedItemDto>>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;

    public GetTaskFeedQueryHandler(ITaskoDbContext db, ICurrentStateService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<IReadOnlyList<TaskFeedItemDto>> Handle(GetTaskFeedQuery request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
        if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

        var skip = request.Skip < 0 ? 0 : request.Skip;
        var take = request.Take is < 1 or > 200 ? 50 : request.Take;

        // (опционально) проверка, что это реально мастер
        var canUseFeed = await _db.Users.AsNoTracking()
            .AnyAsync(u => u.Id == userId
                           && u.IsActive
                           && u.IsExecutorActive
                           && (u.RoleType == UserRoleType.Executor || u.RoleType == UserRoleType.Both), ct);

        if (!canUseFeed)
            throw new UnauthorizedAccessException("Only active executors can use feed.");

        // Один запрос: Published + category in executor categories
        var q =
            from t in _db.Tasks.AsNoTracking()
            join ec in _db.ExecutorCategories.AsNoTracking()
                on new { CatId = t.CategoryId, UserId = userId }
                equals new { CatId = ec.CategoryId, UserId = ec.UserId }
            where t.Status == Tasko.Domain.Entities.Tasks.TaskStatus.Published
                  && t.CreatedByUserId != userId
            select t;

        // Фильтр по локации (показываем район + AllCity)
        if (request.LocationType is not null)
        {
            var loc = request.LocationType.Value;

            if (loc == LocationType.AllCity)
                q = q.Where(t => t.LocationType == LocationType.AllCity);
            else
                q = q.Where(t => t.LocationType == loc);
        }

        var items = await q
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip(skip)
            .Take(take)
            .Select(x => new TaskFeedItemDto
            {
                Id = x.Id,
                Title = x.Title,
                Description = x.Description,
                Budget = x.Budget,
                CategoryId = x.CategoryId,
                LocationType = x.LocationType,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync(ct);

        return items;
    }
}
