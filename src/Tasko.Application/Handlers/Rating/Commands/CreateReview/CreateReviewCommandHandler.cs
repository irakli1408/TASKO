using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.Rating;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Rating;

namespace Tasko.Application.Handlers.Rating.Commands.CreateReview
{
    public sealed class CreateReviewCommandHandler : IRequestHandler<CreateReviewCommand, ReviewDto>
    {
        private readonly ITaskoDbContext _db;
        private readonly ICurrentStateService _current;

        public CreateReviewCommandHandler(ITaskoDbContext db, ICurrentStateService current)
        {
            _db = db;
            _current = current;
        }

        public async Task<ReviewDto> Handle(CreateReviewCommand request, CancellationToken ct)
        {
            if (!_current.IsAuthenticated)
                throw new UnauthorizedAccessException();

            if (!long.TryParse(_current.UserId, out var userId))
                throw new UnauthorizedAccessException();

            var task = await _db.Tasks
                .FirstOrDefaultAsync(x => x.Id == request.TaskId, ct)
                ?? throw new KeyNotFoundException("Task not found.");

            if (task.Status != Tasko.Domain.Entities.Tasks.TaskStatus.Completed)
                throw new InvalidOperationException("Review can only be left for completed tasks.");

            if (task.CreatedByUserId != userId)
                throw new UnauthorizedAccessException("Only the customer can leave a review.");

            if (task.AssignedToUserId is null)
                throw new InvalidOperationException("Task has no assigned executor.");

            if (task.AssignedToUserId == userId)
                throw new InvalidOperationException("You cannot review yourself.");

            var alreadyExists = await _db.Reviews
                .AnyAsync(x => x.TaskId == request.TaskId && x.FromUserId == userId, ct);

            if (alreadyExists)
                throw new InvalidOperationException("Review for this task already exists.");

            var review = new Review(
                request.TaskId,
                userId,
                task.AssignedToUserId.Value,
                request.Score,
                request.Comment
            );

            _db.Reviews.Add(review);

            var executor = await _db.Users
                .FirstOrDefaultAsync(x => x.Id == task.AssignedToUserId.Value, ct)
                ?? throw new KeyNotFoundException("Executor not found.");

            executor.AddRating(request.Score);

            await _db.SaveChangesAsync(ct);

            return new ReviewDto
            {
                Id = review.Id,
                TaskId = review.TaskId,
                FromUserId = review.FromUserId,
                ToUserId = review.ToUserId,
                Score = review.Score,
                Comment = review.Comment,
                CreatedAtUtc = review.CreatedAtUtc
            };
        }
    }
}
