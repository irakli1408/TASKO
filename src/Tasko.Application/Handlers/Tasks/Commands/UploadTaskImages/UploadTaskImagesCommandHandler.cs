using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Services;
using Tasko.Application.DTO.Media;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Media;

namespace Tasko.Application.Handlers.Tasks.Commands.UploadTaskImages;

public sealed class UploadTaskImagesCommandHandler : IRequestHandler<UploadTaskImagesCommand, IReadOnlyList<MediaFileDto>>
{
    private const int MaxTaskImages = 5;

    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;
    private readonly IMediaService _media;

    public UploadTaskImagesCommandHandler(ITaskoDbContext db, ICurrentStateService current, IMediaService media)
    {
        _db = db;
        _current = current;
        _media = media;
    }

    public async Task<IReadOnlyList<MediaFileDto>> Handle(UploadTaskImagesCommand request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
        if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

        if (request.Files is null || request.Files.Count == 0)
            throw new ArgumentException("No files provided.");

        var task = await _db.Tasks.FirstOrDefaultAsync(x => x.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Task not found.");

        if (task.CreatedByUserId != userId)
            throw new UnauthorizedAccessException();

        if (task.Status != Tasko.Domain.Entities.Tasks.TaskStatus.Draft)
            throw new InvalidOperationException("Task images can be changed only while Draft.");

        var existingCount = await _db.FileMaps
            .AsNoTracking()
            .CountAsync(x => x.OwnerType == MediaOwnerType.TaskPost && x.OwnerId == request.TaskId, ct);

        if (existingCount >= MaxTaskImages)
            throw new InvalidOperationException($"Maximum {MaxTaskImages} images per task.");

        if (existingCount + request.Files.Count > MaxTaskImages)
            throw new InvalidOperationException($"You can upload only {MaxTaskImages - existingCount} more images.");

        var result = new List<MediaFileDto>(request.Files.Count);
        var sort = existingCount;

        foreach (var f in request.Files)
        {
            await using (f.Content)
            {
                var saved = await _media.SaveImageAsync(
                    createdByUserId: userId,
                    relativeFolder: $"uploads/tasks/{request.TaskId}",
                    file: f,
                    ct: ct);

                var map = new FileMap(MediaOwnerType.TaskPost, request.TaskId, saved.Id, sortOrder: sort++);
                _db.FileMaps.Add(map);

                result.Add(new MediaFileDto
                {
                    FileId = saved.Id,
                    Url = _media.ToPublicUrl(saved.StoragePath),
                    ContentType = saved.ContentType,
                    SizeBytes = saved.SizeBytes,
                    SortOrder = map.SortOrder,
                    CreatedAtUtc = saved.CreatedAtUtc
                });
            }
        }

        await _db.SaveChangesAsync(ct);
        return result;
    }
}
