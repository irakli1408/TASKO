namespace Tasko.Application.Abstractions.Services;

public interface INotificationService
{
    Task NotifyOfferCreatedAsync(long taskId, long offerId, long executorUserId, CancellationToken ct); 
    Task NotifyOfferAcceptedAsync(long taskId, long offerId, long executorUserId, CancellationToken ct);
}
