using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Services;
using Tasko.Application.Media;
using Tasko.Domain.Entities.Media;

namespace Tasko.Application.Services;

public sealed class MediaService : IMediaService
{
    private static readonly HashSet<string> AllowedExt = new(StringComparer.OrdinalIgnoreCase)
    { ".jpg", ".jpeg", ".png", ".webp" };

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    { "image/jpeg", "image/png", "image/webp" };

    private const long MaxImageBytes = 10L * 1024 * 1024; // 10 MB (MVP)

    private readonly ITaskoDbContext _db;
    private readonly IFileStorage _storage;

    public MediaService(ITaskoDbContext db, IFileStorage storage)
    {
        _db = db;
        _storage = storage;
    }

    public string ToPublicUrl(string storagePath)
        => storagePath.StartsWith("/") ? storagePath : "/" + storagePath.Replace("\\", "/");

    public async Task<MediaFile> SaveImageAsync(long createdByUserId, string relativeFolder, UploadFile file, CancellationToken ct)
    {
        if (file.Length <= 0) throw new ArgumentException("Empty file.");
        if (file.Length > MaxImageBytes) throw new InvalidOperationException("File is too large.");
        if (!AllowedContentTypes.Contains(file.ContentType)) throw new InvalidOperationException("Unsupported image content type.");

        var ext = Path.GetExtension(file.FileName) ?? "";
        if (!AllowedExt.Contains(ext)) throw new InvalidOperationException("Unsupported image extension.");

        var safeExt = ext.ToLowerInvariant();
        var newName = $"{Guid.NewGuid():N}{safeExt}";

        // 1) save physical file
        var storagePath = await _storage.SaveAsync(relativeFolder, newName, file.Content, ct);

        // 2) save db metadata
        var entity = new MediaFile(
            createdByUserId: createdByUserId,
            kind: MediaKind.Image,
            originalName: file.FileName,
            contentType: file.ContentType,
            sizeBytes: file.Length,
            storagePath: storagePath
        );

        _db.Files.Add(entity);
        await _db.SaveChangesAsync(ct);

        return entity;
    }

    public async Task DeleteFileIfOrphanAsync(long fileId, CancellationToken ct)
    {
        var hasMaps = await _db.FileMaps.AsNoTracking().AnyAsync(x => x.FileId == fileId, ct);
        if (hasMaps) return;

        var file = await _db.Files.FirstOrDefaultAsync(x => x.Id == fileId, ct);
        if (file is null) return;

        await _storage.DeleteAsync(file.StoragePath, ct);
        _db.Files.Remove(file);
        await _db.SaveChangesAsync(ct);
    }
}
