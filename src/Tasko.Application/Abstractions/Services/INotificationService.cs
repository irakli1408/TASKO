namespace Tasko.Application.Abstractions.Services;

public interface INotificationService
{
    Task NotifyOfferCreatedAsync(long taskId, long offerId, long executorUserId, CancellationToken ct);
    Task NotifyTaskAssignedAsync(long taskId, long customerUserId, long executorUserId, CancellationToken ct);

    // ✅ chat message notification
    Task NotifyMessageSentAsync(
        long taskId,
        long messageId,
        long senderUserId,
        long recipientUserId,
        string preview,
        CancellationToken ct);
}
