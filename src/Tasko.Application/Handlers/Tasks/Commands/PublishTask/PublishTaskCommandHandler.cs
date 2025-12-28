using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Realtime;
using Tasko.Application.DTO.Tasks;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Application.Handlers.Tasks.Commands.PublishTask;

public sealed class PublishTaskCommandHandler : IRequestHandler<PublishTaskCommand>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;
    private readonly ITaskRealtime _realtime;

    public PublishTaskCommandHandler(ITaskoDbContext db, ICurrentStateService current, ITaskRealtime realtime)
    {
        _db = db;
        _current = current;
        _realtime = realtime;
    }

    public async Task Handle(PublishTaskCommand request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
        if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

        var task = await _db.Tasks.FirstOrDefaultAsync(x => x.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Task not found.");

        if (task.CreatedByUserId != userId) throw new UnauthorizedAccessException();

        if (task.CategoryId <= 0)
            throw new InvalidOperationException("Task category is not set.");

        // validate category is active + leaf (ParentId != null)
        var cat = await _db.Categories
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == task.CategoryId && x.IsActive, ct);

        if (cat is null)
            throw new InvalidOperationException("Category not found.");

        if (cat.ParentId is null)
            throw new InvalidOperationException("Task must have a subcategory (leaf).");

        task.Publish();
        await _db.SaveChangesAsync(ct);

        // ✅ найти подходящих мастеров по категории задачи
        var executorIds = await (
            from ec in _db.ExecutorCategories.AsNoTracking()
            join u in _db.Users.AsNoTracking() on ec.UserId equals u.Id
            where ec.CategoryId == task.CategoryId
                  && u.IsActive
                  && u.IsExecutorActive
                  && (u.RoleType == UserRoleType.Executor || u.RoleType == UserRoleType.Both)
                  && u.Id != task.CreatedByUserId
            select u.Id
        ).Distinct().ToListAsync(ct);

        // ✅ отправить уведомление только им
        await _realtime.TaskPublishedToExecutors(
            executorIds,
            new TaskPublishedNotificationDto
            {
                TaskId = task.Id,
                CategoryId = task.CategoryId,
                Title = task.Title,
                Budget = task.Budget,
                CreatedAtUtc = task.CreatedAtUtc
            },
            ct);
    }
}
