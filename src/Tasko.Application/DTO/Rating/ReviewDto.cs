namespace Tasko.Application.DTO.Rating
{
    public sealed class ReviewDto
    {
        public long Id { get; init; }
        public long TaskId { get; init; }
        public long FromUserId { get; init; }
        public long ToUserId { get; init; }
        public int Score { get; init; }
        public string? Comment { get; init; }
        public DateTime CreatedAtUtc { get; init; }
    }
}
