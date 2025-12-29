using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Services;
using Tasko.Application.DTO.Media;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Media;

namespace Tasko.Application.Handlers.Tasks.Queries.GetTaskImages;

public sealed class GetTaskImagesQueryHandler : IRequestHandler<GetTaskImagesQuery, IReadOnlyList<MediaFileDto>>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;
    private readonly IMediaService _media;

    public GetTaskImagesQueryHandler(ITaskoDbContext db, ICurrentStateService current, IMediaService media)
    {
        _db = db;
        _current = current;
        _media = media;
    }

    public async Task<IReadOnlyList<MediaFileDto>> Handle(GetTaskImagesQuery request, CancellationToken ct)
    {
        var task = await _db.Tasks.AsNoTracking().FirstOrDefaultAsync(x => x.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Task not found.");

        // Draft images are private (only owner)
        if (task.Status == Tasko.Domain.Entities.Tasks.TaskStatus.Draft)
        {
            if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
            if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();
            if (task.CreatedByUserId != userId) throw new UnauthorizedAccessException();
        }

        var list = await _db.FileMaps
            .AsNoTracking()
            .Where(x => x.OwnerType == MediaOwnerType.TaskPost && x.OwnerId == request.TaskId)
            .Join(_db.Files.AsNoTracking(),
                m => m.FileId,
                f => f.Id,
                (m, f) => new MediaFileDto
                {
                    FileId = f.Id,
                    Url = _media.ToPublicUrl(f.StoragePath),
                    ContentType = f.ContentType,
                    SizeBytes = f.SizeBytes,
                    SortOrder = m.SortOrder,
                    CreatedAtUtc = f.CreatedAtUtc
                })
            .OrderBy(x => x.SortOrder)
            .ToListAsync(ct);

        return list;
    }
}
