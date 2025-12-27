using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Services;
using Tasko.Application.DTO.Tasks;
using Tasko.Common.CurrentState;

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
        var hasOffer = await _db.Offers
            .AsNoTracking()
            .AnyAsync(x => x.TaskId == request.TaskId && x.ExecutorUserId == userId, ct);

        var canRead =
            task.CreatedByUserId == userId ||
            task.AssignedToUserId == userId ||
            hasOffer;

        if (!canRead) throw new UnauthorizedAccessException();

        // ✅ Views = сколько уникальных мастеров посмотрели заказ (метрика для заказчика)
        // Считаем только когда НЕ владелец task (т.е. мастер)
        if (task.CreatedByUserId != userId)
        {
            await _taskViewService.TrackTaskViewAsync(task.Id, userId, ct);
        }

        // заказчик видит все offers, мастер — только свой (чтобы не видеть конкурентов)
        var q = _db.Offers.AsNoTracking().Where(x => x.TaskId == request.TaskId);

        if (task.CreatedByUserId != userId)
            q = q.Where(x => x.ExecutorUserId == userId);

        var page = await q
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip(skip)
            .Take(take)
            .Select(x => new OfferDto
            {
                Id = x.Id,
                TaskId = x.TaskId,
                ExecutorUserId = x.ExecutorUserId,
                Price = x.Price,
                Comment = x.Comment,
                Status = x.Status.ToString(),
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync(ct);

        return page;
    }
}
