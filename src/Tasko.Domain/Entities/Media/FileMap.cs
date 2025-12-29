namespace Tasko.Domain.Entities.Media;

public sealed class FileMap
{
    private FileMap() { }

    public FileMap(MediaOwnerType ownerType, long ownerId, long fileId, int sortOrder)
    {
        OwnerType = ownerType;
        OwnerId = ownerId;
        FileId = fileId;
        SortOrder = sortOrder;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public long Id { get; private set; }

    public MediaOwnerType OwnerType { get; private set; }
    public long OwnerId { get; private set; }

    public long FileId { get; private set; }
    public MediaFile File { get; private set; } = null!;

    public int SortOrder { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
}
