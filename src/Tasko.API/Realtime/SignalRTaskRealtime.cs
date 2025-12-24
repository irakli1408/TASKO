using Microsoft.AspNetCore.SignalR;
using Tasko.Application.Abstractions.Realtime;
using Tasko.Application.DTO.Tasks;

namespace Tasko.API.Realtime
{
    public sealed class SignalRTaskRealtime : ITaskRealtime
    {
        private readonly IHubContext<TaskHub> _hub;

        public SignalRTaskRealtime(IHubContext<TaskHub> hub)
        {
            _hub = hub;
        }

        public Task OfferCreated(long taskId, OfferDto offer, CancellationToken ct)
            => _hub.Clients.Group(TaskHub.GroupName(taskId))
                .SendAsync("OfferCreated", new { taskId, offer }, ct);

        public Task TaskPublished(long taskId, CancellationToken ct)
            => _hub.Clients.Group(TaskHub.GroupName(taskId))
                .SendAsync("TaskPublished", new { taskId }, ct);

        public Task TaskAssigned(long taskId, long executorUserId, CancellationToken ct)
            => _hub.Clients.Group(TaskHub.GroupName(taskId))
                .SendAsync("TaskAssigned", new { taskId, executorUserId }, ct);
    }
}
