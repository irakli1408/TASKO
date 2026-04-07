namespace Tasko.Domain.Entities.Rating
{
    public sealed class Review
    {
        private Review() { }

        public Review(long taskId, long fromUserId, long toUserId, int score, string? comment)
        {
            if (score < 1 || score > 5)
                throw new ArgumentOutOfRangeException(nameof(score), "Score must be between 1 and 5.");

            TaskId = taskId;
            FromUserId = fromUserId;
            ToUserId = toUserId;
            Score = score;
            Comment = string.IsNullOrWhiteSpace(comment) ? null : comment.Trim();
            CreatedAtUtc = DateTime.UtcNow;
        }

        public long Id { get; private set; }
        public long TaskId { get; private set; }
        public long FromUserId { get; private set; }
        public long ToUserId { get; private set; }
        public int Score { get; private set; }
        public string? Comment { get; private set; }
        public DateTime CreatedAtUtc { get; private set; }
    }
}
