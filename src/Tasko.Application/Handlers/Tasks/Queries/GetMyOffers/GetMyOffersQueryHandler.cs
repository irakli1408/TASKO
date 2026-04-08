using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.Tasks;
using Tasko.Common.CurrentState;

namespace Tasko.Application.Handlers.Tasks.Queries.GetMyOffers;

public sealed class GetMyOffersQueryHandler : IRequestHandler<GetMyOffersQuery, IReadOnlyList<OfferListItemDto>>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;

    public GetMyOffersQueryHandler(ITaskoDbContext db, ICurrentStateService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<IReadOnlyList<OfferListItemDto>> Handle(GetMyOffersQuery request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated)
            throw new UnauthorizedAccessException();

        if (!long.TryParse(_current.UserId, out var userId))
            throw new UnauthorizedAccessException();

        var take = Math.Clamp(request.Take, 1, 100);
        var skip = Math.Max(0, request.Skip);

        var items = await _db.Offers
            .AsNoTracking()
            .Where(x => x.ExecutorUserId == userId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip(skip)
            .Take(take)
            .Join(
                _db.Tasks.AsNoTracking(),
                offer => offer.TaskId,
                task => task.Id,
                (offer, task) => new { offer, task }
            )
            .Join(
                _db.Categories.AsNoTracking(),
                x => x.task.CategoryId,
                category => category.Id,
                (x, category) => new { x.offer, x.task, category }
            )
            .Join(
                _db.Users.AsNoTracking(),
                x => x.task.CreatedByUserId,
                user => user.Id,
                (x, user) => new OfferListItemDto
                {
                    OfferId = x.offer.Id,
                    TaskId = x.task.Id,
                    TaskTitle = x.task.Title,
                    TaskDescription = x.task.Description,
                    Price = x.offer.Price,
                    Status = x.offer.Status.ToString(),
                    CategoryId = x.category.Id,
                    CategoryName = x.category.Name,
                    LocationType = (int)x.task.LocationType,
                    CustomerName = $"{user.FirstName} {user.LastName}".Trim(),
                    CreatedAtUtc = x.offer.CreatedAtUtc
                }
            )
            .ToListAsync(ct);

        return items;
    }
}
