namespace Tasko.Application.DTO.Rating;

public sealed class ReviewListItemDto
{
    public long Id { get; init; }
    public long TaskId { get; init; }
    public long FromUserId { get; init; }
    public string FromUserName { get; init; } = string.Empty;
    public int Score { get; init; }
    public string? Comment { get; init; }
    public DateTime CreatedAtUtc { get; init; }
}
