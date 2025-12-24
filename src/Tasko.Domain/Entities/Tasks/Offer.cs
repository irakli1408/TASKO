namespace Tasko.Domain.Entities.Tasks;

public sealed class Offer
{
    private Offer() { }

    public Offer(long taskId, long executorUserId, decimal price, string? comment)
    {
        TaskId = taskId;
        ExecutorUserId = executorUserId;
        Price = price;
        Comment = comment;
        Status = OfferStatus.Active;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public long Id { get; private set; }
    public long TaskId { get; private set; }
    public long ExecutorUserId { get; private set; }

    public decimal Price { get; private set; }
    public string? Comment { get; private set; }

    public OfferStatus Status { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    public void Accept()
    {
        if (Status != OfferStatus.Active)
            throw new InvalidOperationException("Offer is not Active.");

        Status = OfferStatus.Accepted;
    }

    public void Withdraw()
    {
        if (Status != OfferStatus.Active)
            throw new InvalidOperationException("Offer is not Active.");

        Status = OfferStatus.Withdrawn;
    }
}
