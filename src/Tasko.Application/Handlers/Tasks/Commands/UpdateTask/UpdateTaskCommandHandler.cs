using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Tasks;

namespace Tasko.Application.Handlers.Tasks.Commands.UpdateTask;

public sealed class UpdateTaskCommandHandler : IRequestHandler<UpdateTaskCommand>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;

    public UpdateTaskCommandHandler(ITaskoDbContext db, ICurrentStateService current)
    {
        _db = db;
        _current = current;
    }

    public async Task Handle(UpdateTaskCommand request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
        if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

        // must provide at least one field
        if (request.Title is null
            && request.Description is null
            && request.Budget is null
            && request.CategoryId is null
            && request.LocationType is null)
        {
            throw new ArgumentException("At least one field must be provided.");
        }

        var task = await _db.Tasks
            .FirstOrDefaultAsync(x => x.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Task not found.");

        if (task.CreatedByUserId != userId)
            throw new UnauthorizedAccessException();

        // Variant A: no updates after publish
        if (task.Status != Tasko.Domain.Entities.Tasks.TaskStatus.Draft)
            throw new InvalidOperationException("Task cannot be edited after publish.");

        // category: validate exists + active + leaf (same as CreateTask)
        if (request.CategoryId is not null)
        {
            var cat = await _db.Categories
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == request.CategoryId.Value && x.IsActive, ct);

            if (cat is null)
                throw new InvalidOperationException("Category not found.");

            if (cat.ParentId is null)
                throw new InvalidOperationException("You must select a subcategory (leaf).");

            task.SetCategory(request.CategoryId.Value);
        }

        if (request.LocationType is not null)
        {
            if ((int)request.LocationType.Value == 0)
                throw new ArgumentException("LocationType is invalid.");

            task.SetLocation(request.LocationType.Value);
        }

        task.UpdateDraft(
            title: request.Title,
            description: request.Description,
            budget: request.Budget
        );

        await _db.SaveChangesAsync(ct);
    }
}
