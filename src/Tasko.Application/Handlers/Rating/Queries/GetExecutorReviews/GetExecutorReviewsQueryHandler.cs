using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.Rating;

namespace Tasko.Application.Handlers.Rating.Queries.GetExecutorReviews;

public sealed class GetExecutorReviewsQueryHandler
    : IRequestHandler<GetExecutorReviewsQuery, IReadOnlyList<ReviewListItemDto>>
{
    private readonly ITaskoDbContext _db;

    public GetExecutorReviewsQueryHandler(ITaskoDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<ReviewListItemDto>> Handle(GetExecutorReviewsQuery request, CancellationToken ct)
    {
        if (request.ExecutorUserId <= 0)
            throw new ArgumentOutOfRangeException(nameof(request.ExecutorUserId));

        var skip = Math.Max(0, request.Skip);
        var take = Math.Clamp(request.Take, 1, 100);

        var items = await _db.Reviews
            .AsNoTracking()
            .Where(x => x.ToUserId == request.ExecutorUserId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip(skip)
            .Take(take)
            .Join(
                _db.Users.AsNoTracking(),
                review => review.FromUserId,
                user => user.Id,
                (review, user) => new ReviewListItemDto
                {
                    Id = review.Id,
                    TaskId = review.TaskId,
                    FromUserId = review.FromUserId,
                    FromUserName = $"{user.FirstName} {user.LastName}".Trim(),
                    Score = review.Score,
                    Comment = review.Comment,
                    CreatedAtUtc = review.CreatedAtUtc
                }
            )
            .ToListAsync(ct);

        return items;
    }
}
