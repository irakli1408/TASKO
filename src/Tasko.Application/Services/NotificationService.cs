using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Realtime;
using Tasko.Application.Abstractions.Services;
using Tasko.Application.DTO.Notifications;
using Tasko.Domain.Entities.Notifications;

namespace Tasko.Application.Services;

public sealed class NotificationService : INotificationService
{
    private readonly ITaskoDbContext _db;
    private readonly INotificationRealtime _realtime;

    public NotificationService(ITaskoDbContext db, INotificationRealtime realtime)
    {
        _db = db;
        _realtime = realtime;
    }

    public async Task NotifyOfferCreatedAsync(long taskId, long offerId, long executorUserId, CancellationToken ct)
    {
        var task = await _db.Tasks
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == taskId, ct);

        if (task is null) return;

        var customerUserId = task.CreatedByUserId;

        var dataJson = JsonSerializer.Serialize(new
        {
            taskId,
            offerId,
            executorUserId
        });

        var n = new Notification(
            userId: customerUserId,
            type: NotificationType.OfferCreated,
            title: "New offer on your task",
            body: "A master has responded to your task.",
            dataJson: dataJson
        );

        _db.Notifications.Add(n);
        await _db.SaveChangesAsync(ct);

        // ✅ realtime push
        await _realtime.NotificationCreated(customerUserId, ToDto(n), ct);
    }

    public async Task NotifyTaskAssignedAsync(long taskId, long customerUserId, long executorUserId, CancellationToken ct)
    {
        var dataJson = JsonSerializer.Serialize(new
        {
            taskId,
            customerUserId,
            executorUserId
        });

        var nCustomer = new Notification(
            userId: customerUserId,
            type: NotificationType.TaskAssigned,
            title: "Executor assigned",
            body: "You have assigned a master to your task.",
            dataJson: dataJson
        );

        var nExecutor = new Notification(
            userId: executorUserId,
            type: NotificationType.TaskAssigned,
            title: "You were assigned to a task",
            body: "A customer has assigned you to their task.",
            dataJson: dataJson
        );

        _db.Notifications.Add(nCustomer);
        _db.Notifications.Add(nExecutor);

        await _db.SaveChangesAsync(ct);

        // ✅ realtime push (двум пользователям)
        await _realtime.NotificationCreated(customerUserId, ToDto(nCustomer), ct);
        await _realtime.NotificationCreated(executorUserId, ToDto(nExecutor), ct);
    }

    private static NotificationDto ToDto(Notification n) => new()
    {
        Id = n.Id,
        Type = n.Type,
        Title = n.Title,
        Body = n.Body,
        DataJson = n.DataJson,
        IsRead = n.IsRead,
        CreatedAtUtc = n.CreatedAtUtc
    };
}
