using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Services;
using Tasko.Application.DTO.Rating;
using Tasko.Application.DTO.Tasks;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Application.Handlers.Tasks.Queries.GetTaskById;

public sealed class GetTaskByIdQueryHandler : IRequestHandler<GetTaskByIdQuery, TaskDetailsDto>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;
    private readonly ITaskViewService _views;

    public GetTaskByIdQueryHandler(ITaskoDbContext db, ICurrentStateService current, ITaskViewService views)
    {
        _db = db;
        _current = current;
        _views = views;
    }

    public async Task<TaskDetailsDto> Handle(GetTaskByIdQuery request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated)
            throw new UnauthorizedAccessException();

        if (!long.TryParse(_current.UserId, out var userId))
            throw new UnauthorizedAccessException();

        // 1) load task (no tracking, cheap)
        var task = await _db.Tasks
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Task not found.");

        // 2) access rules
        // creator / assigned / executor with existing offer
        // plus: active executor can preview published task details before sending an offer
        var isCreator = task.CreatedByUserId == userId;
        var isAssigned = task.AssignedToUserId == userId;

        var hasOffer = await _db.Offers
            .AsNoTracking()
            .AnyAsync(x => x.TaskId == task.Id && x.ExecutorUserId == userId, ct);

        var canPreviewAsExecutor = false;

        if (!isCreator && !isAssigned && !hasOffer && task.Status == Tasko.Domain.Entities.Tasks.TaskStatus.Published)
        {
            canPreviewAsExecutor = await _db.Users
                .AsNoTracking()
                .AnyAsync(u => u.Id == userId
                               && u.IsActive
                               && u.IsExecutorActive
                               && (u.RoleType == UserRoleType.Executor || u.RoleType == UserRoleType.Both), ct);
        }

        if (!isCreator && !isAssigned && !hasOffer && !canPreviewAsExecutor)
            throw new UnauthorizedAccessException("Access denied.");

        // 3) track unique view (service already ignores owner)
        await _views.TrackTaskViewAsync(task.Id, userId, ct);

        // 4) get fresh ViewsCount after increment
        var viewsCount = await _db.Tasks
            .AsNoTracking()
            .Where(x => x.Id == task.Id)
            .Select(x => x.ViewsCount)
            .FirstAsync(ct);

        var participantIds = new List<long> { task.CreatedByUserId };

        if (task.AssignedToUserId.HasValue)
        {
            participantIds.Add(task.AssignedToUserId.Value);
        }

        var participants = await _db.Users
            .AsNoTracking()
            .Where(x => participantIds.Contains(x.Id))
            .Select(x => new
            {
                x.Id,
                x.FirstName,
                x.LastName
            })
            .ToListAsync(ct);

        var creator = participants.FirstOrDefault(x => x.Id == task.CreatedByUserId);
        var assigned = task.AssignedToUserId.HasValue
            ? participants.FirstOrDefault(x => x.Id == task.AssignedToUserId.Value)
            : null;

        var review = await _db.Reviews
            .AsNoTracking()
            .Where(x => x.TaskId == task.Id)
            .Select(x => new ReviewDto
            {
                Id = x.Id,
                TaskId = x.TaskId,
                FromUserId = x.FromUserId,
                ToUserId = x.ToUserId,
                Score = x.Score,
                Comment = x.Comment,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .FirstOrDefaultAsync(ct);

        return new TaskDetailsDto
        {
            Id = task.Id,
            CreatedByUserId = task.CreatedByUserId,
            AssignedToUserId = task.AssignedToUserId,
            CreatedByFirstName = creator?.FirstName ?? string.Empty,
            CreatedByLastName = creator?.LastName ?? string.Empty,
            AssignedToFirstName = assigned?.FirstName,
            AssignedToLastName = assigned?.LastName,

            Title = task.Title,
            Description = task.Description,
            Budget = task.Budget,
            PreferredTime = task.PreferredTime,

            // if Status is enum, cast; if int, replace with task.Status
            Status = (int)task.Status,

            CreatedAtUtc = task.CreatedAtUtc,
            ViewsCount = viewsCount,
            Review = review
        };
    }
}
