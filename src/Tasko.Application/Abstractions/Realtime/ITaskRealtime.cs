using Tasko.Application.DTO.Tasks;

namespace Tasko.Application.Abstractions.Realtime;

public interface ITaskRealtime
{
    Task OfferCreated(long taskId, OfferDto offer, CancellationToken ct);
    Task TaskPublished(long taskId, CancellationToken ct);
    Task TaskAssigned(long taskId, long executorUserId, CancellationToken ct);
}
