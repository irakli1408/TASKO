namespace Tasko.Application.DTO.Tasks
{
    public sealed class TaskPublishedNotificationDto
    {
        public long TaskId { get; set; }
        public long CategoryId { get; set; }
        public string Title { get; set; } = null!;
        public decimal? Budget { get; set; }
        public DateTime CreatedAtUtc { get; set; }
    }
}
