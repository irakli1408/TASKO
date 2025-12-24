namespace Tasko.Application.DTO.Tasks;

public sealed class OfferDto
{
    public long Id { get; init; }
    public long TaskId { get; init; }
    public long ExecutorUserId { get; init; }

    public decimal Price { get; init; }
    public string? Comment { get; init; }

    public string Status { get; init; } = null!;
    public DateTime CreatedAtUtc { get; init; }
}
