using Tasko.Application.Abstractions.Realtime;
using Tasko.Application.DTO.Tasks;

namespace Tasko.API.Realtime;

public sealed class NoOpTaskRealtime : ITaskRealtime
{
    public Task OfferCreated(long taskId, OfferDto offer, CancellationToken ct) => Task.CompletedTask;
    public Task TaskPublished(long taskId, CancellationToken ct) => Task.CompletedTask;
    public Task TaskAssigned(long taskId, long executorUserId, CancellationToken ct) => Task.CompletedTask;
    public Task TaskPublishedToExecutors(IReadOnlyList<long> executorIds, TaskPublishedNotificationDto dto, CancellationToken ct)
            => Task.CompletedTask;
}
