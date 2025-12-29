using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Services;
using Tasko.Application.Media;
using Tasko.Domain.Entities.Media;

namespace Tasko.Application.Services;

public sealed class MediaService : IMediaService
{
    private readonly ITaskoDbContext _db;
    private readonly IFileStorage _storage;

    private readonly MediaOptions _opt;
    private readonly HashSet<string> _allowedExt;
    private readonly HashSet<string> _allowedTypes;

    public MediaService(ITaskoDbContext db, IFileStorage storage, IOptions<MediaOptions> opt)
    {
        _db = db;
        _storage = storage;

        _opt = opt.Value;

        _allowedExt = new HashSet<string>(
            _opt.AllowedImageExtensions.Select(x => x.ToLowerInvariant()));

        _allowedTypes = new HashSet<string>(
            _opt.AllowedImageContentTypes,
            StringComparer.OrdinalIgnoreCase);
    }

    public string ToPublicUrl(string storagePath)
        => storagePath.StartsWith("/") ? storagePath : "/" + storagePath.Replace("\\", "/");

    public async Task<MediaFile> SaveImageAsync(long createdByUserId, string relativeFolder, UploadFile file, CancellationToken ct)
    {
        if (file.Length <= 0)
            throw new ArgumentException("Empty file.");

        if (file.Length > _opt.MaxImageBytes)
            throw new InvalidOperationException("File is too large.");

        if (!_allowedTypes.Contains(file.ContentType))
            throw new InvalidOperationException("Unsupported image content type.");

        var ext = (Path.GetExtension(file.FileName) ?? "").ToLowerInvariant();
        if (!_allowedExt.Contains(ext))
            throw new InvalidOperationException("Unsupported image extension.");

        var newName = $"{Guid.NewGuid():N}{ext}";

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
