using MediatR;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.Tasks;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Tasks;

namespace Tasko.Application.Handlers.Tasks.Commands.CreateTask;

public sealed class CreateTaskCommandHandler : IRequestHandler<CreateTaskCommand, TaskDto>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;

    public CreateTaskCommandHandler(ITaskoDbContext db, ICurrentStateService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<TaskDto> Handle(CreateTaskCommand request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
        if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

        var entity = new TaskPost(
            createdByUserId: userId,
            title: request.Title.Trim(),
            description: request.Description?.Trim(),
            budget: request.Budget
        );

        _db.Tasks.Add(entity);
        await _db.SaveChangesAsync(ct);

        return new TaskDto
        {
            Id = entity.Id,
            CreatedByUserId = entity.CreatedByUserId,
            AssignedToUserId = entity.AssignedToUserId,
            Title = entity.Title,
            Description = entity.Description,
            Budget = entity.Budget,
            Status = entity.Status.ToString(),
            CreatedAtUtc = entity.CreatedAtUtc
        };
    }
}
