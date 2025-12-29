namespace Tasko.Application.DTO.Media;

public sealed class MediaFileDto
{
    public long FileId { get; init; }
    public string Url { get; init; } = null!;
    public string ContentType { get; init; } = null!;
    public long SizeBytes { get; init; }
    public int SortOrder { get; init; }
    public DateTime CreatedAtUtc { get; init; }
}
