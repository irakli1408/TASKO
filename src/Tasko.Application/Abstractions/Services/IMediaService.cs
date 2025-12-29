using Tasko.Application.Media;
using Tasko.Domain.Entities.Media;

namespace Tasko.Application.Abstractions.Services;

public interface IMediaService
{
    Task<MediaFile> SaveImageAsync(
        long createdByUserId,
        string relativeFolder,       // e.g. "uploads/tasks/12"
        UploadFile file,
        CancellationToken ct);

    Task DeleteFileIfOrphanAsync(long fileId, CancellationToken ct);

    string ToPublicUrl(string storagePath); // "/uploads/..."
}
