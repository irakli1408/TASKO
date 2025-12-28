using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.Tasks;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Tasks;

namespace Tasko.Application.Handlers.Tasks.Queries.GetTaskStats;

public sealed class GetTaskStatsQueryHandler : IRequestHandler<GetTaskStatsQuery, TaskStatsDto>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;

    public GetTaskStatsQueryHandler(ITaskoDbContext db, ICurrentStateService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<TaskStatsDto> Handle(GetTaskStatsQuery request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated)
            throw new UnauthorizedAccessException();

        if (!long.TryParse(_current.UserId, out var userId))
            throw new UnauthorizedAccessException();

        var task = await _db.Tasks
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Task not found.");

        // stats видит только заказчик
        if (task.CreatedByUserId != userId)
            throw new UnauthorizedAccessException();

        var offers = await _db.Offers
            .AsNoTracking()
            .Where(x => x.TaskId == request.TaskId)
            .ToListAsync(ct);

        var offersCount = offers.Count(x =>
            x.Status == OfferStatus.Active ||
            x.Status == OfferStatus.Accepted ||
            x.Status == OfferStatus.Rejected);

        var activeOffersCount = offers.Count(x =>
            x.Status == OfferStatus.Active);

        var acceptedOffersCount = offers.Count(x =>
            x.Status == OfferStatus.Accepted);

        return new TaskStatsDto
        {
            TaskId = request.TaskId,
            OffersCount = offersCount,
            ActiveOffersCount = activeOffersCount,
            AcceptedOffersCount = acceptedOffersCount,
            ViewsCount = task.ViewsCount
        };
    }
}
