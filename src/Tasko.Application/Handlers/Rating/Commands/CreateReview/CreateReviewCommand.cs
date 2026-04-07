using MediatR;
using Tasko.Application.DTO.Rating;

namespace Tasko.Application.Handlers.Rating.Commands.CreateReview
{
    public sealed record CreateReviewCommand(
     long TaskId,
     int Score,
     string? Comment
 ) : IRequest<ReviewDto>;
}
