namespace Tasko.Domain.Entities.Media;

public sealed class MediaFile
{
    private MediaFile() { }

    public MediaFile(
        long createdByUserId,
        MediaKind kind,
        string originalName,
        string contentType,
        long sizeBytes,
        string storagePath)
    {
        CreatedByUserId = createdByUserId;
        Kind = kind;
        OriginalName = originalName;
        ContentType = contentType;
        SizeBytes = sizeBytes;
        StoragePath = storagePath;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public long Id { get; private set; }

    public long CreatedByUserId { get; private set; }
    public MediaKind Kind { get; private set; }

    public string OriginalName { get; private set; } = null!;
    public string ContentType { get; private set; } = null!;
    public long SizeBytes { get; private set; }

    // relative path inside wwwroot, e.g. "uploads/tasks/12/abc.jpg"
    public string StoragePath { get; private set; } = null!;

    public DateTime CreatedAtUtc { get; private set; }
}
