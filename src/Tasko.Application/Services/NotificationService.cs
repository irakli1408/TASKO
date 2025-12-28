using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Realtime;   // ✅ добавить
using Tasko.Application.Abstractions.Services;
using Tasko.Application.DTO.Notifications;
using Tasko.Domain.Entities.Notifications;

namespace Tasko.Application.Services;

public sealed class NotificationService : INotificationService
{
    private readonly ITaskoDbContext _db;
    private readonly INotificationRealtime _realtime;
    private readonly IChatPresence _presence;     // ✅ добавить

    public NotificationService(ITaskoDbContext db, INotificationRealtime realtime, IChatPresence presence) // ✅ изменить
    {
        _db = db;
        _realtime = realtime;
        _presence = presence;
    }

    public async Task NotifyOfferCreatedAsync(long taskId, long offerId, long executorUserId, CancellationToken ct)
    {
        var task = await _db.Tasks.AsNoTracking().FirstOrDefaultAsync(x => x.Id == taskId, ct);
        if (task is null) return;

        var customerUserId = task.CreatedByUserId;

        var n = new Notification(
            customerUserId,
            NotificationType.OfferCreated,
            "New offer on your task",
            "A master has responded to your task.",
            JsonSerializer.Serialize(new { taskId, offerId, executorUserId })
        );

        _db.Notifications.Add(n);
        await _db.SaveChangesAsync(ct);

        await _realtime.NotificationCreated(customerUserId, ToDto(n), ct);
        await PushUnread(customerUserId, ct);
    }

    public async Task NotifyTaskAssignedAsync(long taskId, long customerUserId, long executorUserId, CancellationToken ct)
    {
        var data = JsonSerializer.Serialize(new { taskId, customerUserId, executorUserId });

        var nCustomer = new Notification(
            customerUserId,
            NotificationType.TaskAssigned,
            "Executor assigned",
            "You have assigned a master to your task.",
            data
        );

        var nExecutor = new Notification(
            executorUserId,
            NotificationType.TaskAssigned,
            "You were assigned to a task",
            "A customer has assigned you to their task.",
            data
        );

        _db.Notifications.AddRange(nCustomer, nExecutor);
        await _db.SaveChangesAsync(ct);

        await _realtime.NotificationCreated(customerUserId, ToDto(nCustomer), ct);
        await _realtime.NotificationCreated(executorUserId, ToDto(nExecutor), ct);

        await PushUnread(customerUserId, ct);
        await PushUnread(executorUserId, ct);
    }

    public async Task NotifyMessageSentAsync(
        long taskId,
        long messageId,
        long senderUserId,
        long recipientUserId,
        string preview,
        CancellationToken ct)
    {
        // ✅ MUTE: если получатель уже в этом чате — НЕ создаём уведомление и НЕ пушим unread-count
        if (_presence.IsInTaskChat(recipientUserId, taskId))
            return;

        var n = new Notification(
            recipientUserId,
            NotificationType.MessageSent,
            "New message",
            preview,
            JsonSerializer.Serialize(new
            {
                taskId,
                messageId,
                senderUserId,
                recipientUserId
            })
        );

        _db.Notifications.Add(n);
        await _db.SaveChangesAsync(ct);

        await _realtime.NotificationCreated(recipientUserId, ToDto(n), ct);
        await PushUnread(recipientUserId, ct);
    }

    private async Task PushUnread(long userId, CancellationToken ct)
    {
        var unread = await _db.Notifications
            .AsNoTracking()
            .CountAsync(x => x.UserId == userId && !x.IsRead, ct);

        await _realtime.UnreadCountChanged(userId, unread, ct);
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
