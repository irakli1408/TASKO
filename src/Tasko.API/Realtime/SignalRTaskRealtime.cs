using Microsoft.AspNetCore.SignalR;
using Tasko.Application.Abstractions.Realtime;
using Tasko.Application.DTO.Tasks;

namespace Tasko.API.Realtime;

public sealed class SignalRTaskRealtime : ITaskRealtime
{
    private readonly IHubContext<TaskHub> _taskHub;
    private readonly IHubContext<NotificationsHub> _notificationsHub;

    public SignalRTaskRealtime(
        IHubContext<TaskHub> taskHub,
        IHubContext<NotificationsHub> notificationsHub)
    {
        _taskHub = taskHub;
        _notificationsHub = notificationsHub;
    }

    public Task OfferCreated(long taskId, OfferDto offer, CancellationToken ct)
        => _taskHub.Clients.Group(TaskHub.GroupName(taskId))
            .SendAsync("OfferCreated", new { taskId, offer }, ct);

    // оставляем как было (внутри карточки задачи)
    public Task TaskPublished(long taskId, CancellationToken ct)
        => _taskHub.Clients.Group(TaskHub.GroupName(taskId))
            .SendAsync("TaskPublished", new { taskId }, ct);

    public Task TaskAssigned(long taskId, long executorUserId, CancellationToken ct)
        => _taskHub.Clients.Group(TaskHub.GroupName(taskId))
            .SendAsync("TaskAssigned", new { taskId, executorUserId }, ct);

    // ✅ главное: рассылка конкретным мастерам
    public Task TaskPublishedToExecutors(IReadOnlyList<long> executorIds, TaskPublishedNotificationDto dto, CancellationToken ct)
    {
        if (executorIds is null || executorIds.Count == 0)
            return Task.CompletedTask;

        var groups = executorIds.Select(NotificationsHub.UserGroup).ToList();

        return _notificationsHub.Clients.Groups(groups)
            .SendAsync("TaskPublished", dto, ct);
    }
}
