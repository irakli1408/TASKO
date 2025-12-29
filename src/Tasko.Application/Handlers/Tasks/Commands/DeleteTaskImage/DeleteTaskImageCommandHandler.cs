using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Services;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Media;
using Tasko.Domain.Entities.Tasks;

namespace Tasko.Application.Handlers.Tasks.Commands.DeleteTaskImage;

public sealed class DeleteTaskImageCommandHandler : IRequestHandler<DeleteTaskImageCommand>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;
    private readonly IMediaService _media;

    public DeleteTaskImageCommandHandler(ITaskoDbContext db, ICurrentStateService current, IMediaService media)
    {
        _db = db;
        _current = current;
        _media = media;
    }

    public async Task Handle(DeleteTaskImageCommand request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
        if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

        var task = await _db.Tasks.FirstOrDefaultAsync(x => x.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Task not found.");

        if (task.CreatedByUserId != userId)
            throw new UnauthorizedAccessException();

        if (task.Status != Tasko.Domain.Entities.Tasks.TaskStatus.Draft)
            throw new InvalidOperationException("Task images can be changed only while Draft.");

        var map = await _db.FileMaps
            .FirstOrDefaultAsync(x =>
                x.OwnerType == MediaOwnerType.TaskPost &&
                x.OwnerId == request.TaskId &&
                x.FileId == request.FileId, ct);

        if (map is null) return;

        _db.FileMaps.Remove(map);
        await _db.SaveChangesAsync(ct);

        await _media.DeleteFileIfOrphanAsync(request.FileId, ct);
    }
}
