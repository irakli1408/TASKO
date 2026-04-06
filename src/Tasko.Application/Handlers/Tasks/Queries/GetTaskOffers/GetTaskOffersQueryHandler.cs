using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Services;
using Tasko.Application.DTO.Tasks;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Application.Handlers.Tasks.Queries.GetTaskOffers;

public sealed class GetTaskOffersQueryHandler : IRequestHandler<GetTaskOffersQuery, IReadOnlyList<OfferDto>>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;
    private readonly ITaskViewService _taskViewService;

    public GetTaskOffersQueryHandler(ITaskoDbContext db, ICurrentStateService current, ITaskViewService taskViewService)
    {
        _db = db;
        _current = current;
        _taskViewService = taskViewService;
    }

    public async Task<IReadOnlyList<OfferDto>> Handle(GetTaskOffersQuery request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
        if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

        var take = Math.Clamp(request.Take, 1, 200);
        var skip = Math.Max(0, request.Skip);

        var task = await _db.Tasks
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Task not found.");

        // доступ: заказчик / назначенный мастер / мастер который делал offer
        // плюс active executor может зайти на published task и получить только свой offer list (часто пустой)
        var hasOffer = await _db.Offers
            .AsNoTracking()
            .AnyAsync(x => x.TaskId == request.TaskId && x.ExecutorUserId == userId, ct);

        var canPreviewAsExecutor = false;

        if (task.CreatedByUserId != userId && task.AssignedToUserId != userId && !hasOffer && task.Status == Tasko.Domain.Entities.Tasks.TaskStatus.Published)
        {
            canPreviewAsExecutor = await _db.Users
                .AsNoTracking()
                .AnyAsync(u => u.Id == userId
                               && u.IsActive
                               && u.IsExecutorActive
                               && (u.RoleType == UserRoleType.Executor || u.RoleType == UserRoleType.Both), ct);
        }

        var canRead =
            task.CreatedByUserId == userId ||
            task.AssignedToUserId == userId ||
            hasOffer ||
            canPreviewAsExecutor;

        if (!canRead) throw new UnauthorizedAccessException();

        // ✅ Views = сколько уникальных мастеров посмотрели заказ (метрика для заказчика)
        // Считаем только когда НЕ владелец task (т.е. мастер)
        if (task.CreatedByUserId != userId)
        {
            await _taskViewService.TrackTaskViewAsync(task.Id, userId, ct);
        }

        // заказчик видит все offers, мастер — только свой (или пусто, если offer еще не создан)
        var q = _db.Offers.AsNoTracking().Where(x => x.TaskId == request.TaskId);

        if (task.CreatedByUserId != userId)
            q = q.Where(x => x.ExecutorUserId == userId);

        var page = await q
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip(skip)
            .Take(take)
            .Join(
                _db.Users.AsNoTracking(),
                offer => offer.ExecutorUserId,
                user => user.Id,
                (offer, user) => new OfferDto
                {
                    Id = offer.Id,
                    TaskId = offer.TaskId,
                    ExecutorUserId = offer.ExecutorUserId,
                    ExecutorFirstName = user.FirstName,
                    ExecutorLastName = user.LastName,
                    ExecutorAvatarUrl = user.AvatarUrl,
                    ExecutorExperienceYears = user.ExperienceYears,
                    ExecutorLocationType = user.LocationType,
                    ExecutorRatingAverage = user.RatingAverage,
                    ExecutorRatingCount = user.RatingCount,
                    Price = offer.Price,
                    Comment = offer.Comment,
                    Status = offer.Status.ToString(),
                    CreatedAtUtc = offer.CreatedAtUtc
                })
            .ToListAsync(ct);

        return page;
    }
}
