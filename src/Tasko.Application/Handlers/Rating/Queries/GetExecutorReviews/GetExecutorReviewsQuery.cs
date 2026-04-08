using MediatR;
using Tasko.Application.DTO.Rating;

namespace Tasko.Application.Handlers.Rating.Queries.GetExecutorReviews;

public sealed record GetExecutorReviewsQuery(
    long ExecutorUserId,
    int Skip = 0,
    int Take = 20
) : IRequest<IReadOnlyList<ReviewListItemDto>>;
