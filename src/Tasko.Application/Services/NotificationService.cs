using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Services;
using Tasko.Domain.Entities.Notifications;

namespace Tasko.Application.Services;

public sealed class NotificationService : INotificationService
{
    private readonly ITaskoDbContext _db;

    public NotificationService(ITaskoDbContext db)
    {
        _db = db;
    }

    public async Task NotifyOfferCreatedAsync(long taskId, long offerId, long executorUserId, CancellationToken ct)
    {
        var task = await _db.Tasks
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == taskId, ct);

        if (task is null) return;

        var dataJson = JsonSerializer.Serialize(new
        {
            taskId,
            offerId,
            executorUserId
        });

        _db.Notifications.Add(new Notification(
            userId: task.CreatedByUserId,
            type: NotificationType.OfferCreated,
            title: "New offer on your task",
            body: "A master has responded to your task.",
            dataJson: dataJson
        ));

        await _db.SaveChangesAsync(ct);
    }

    public async Task NotifyTaskAssignedAsync(long taskId, long customerUserId, long executorUserId, CancellationToken ct)
    {
        var dataJson = JsonSerializer.Serialize(new
        {
            taskId,
            customerUserId,
            executorUserId
        });

        // заказчику
        _db.Notifications.Add(new Notification(
            userId: customerUserId,
            type: NotificationType.TaskAssigned,
            title: "Executor assigned",
            body: "You have assigned a master to your task.",
            dataJson: dataJson
        ));

        // мастеру
        _db.Notifications.Add(new Notification(
            userId: executorUserId,
            type: NotificationType.TaskAssigned,
            title: "You were assigned to a task",
            body: "A customer has assigned you to their task.",
            dataJson: dataJson
        ));

        await _db.SaveChangesAsync(ct);
    }
}
