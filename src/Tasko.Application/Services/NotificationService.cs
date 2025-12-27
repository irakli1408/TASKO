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

        var customerId = task.CreatedByUserId;

        var dataJson = JsonSerializer.Serialize(new
        {
            taskId,
            offerId,
            executorUserId
        });

        var n = new Notification(
            userId: customerId,
            type: NotificationType.OfferCreated,
            title: "New offer on your task",
            body: "A master has responded to your task.",
            dataJson: dataJson
        );

        _db.Notifications.Add(n);
        await _db.SaveChangesAsync(ct);
    }

    public async Task NotifyOfferAcceptedAsync(long taskId, long offerId, long executorUserId, CancellationToken ct)
    {
        var dataJson = JsonSerializer.Serialize(new
        {
            taskId,
            offerId,
            executorUserId
        });

        var n = new Notification(
            userId: executorUserId,
            type: NotificationType.OfferAccepted,
            title: "Your offer was accepted",
            body: "The customer accepted your offer. You have been assigned to the task.",
            dataJson: dataJson
        );

        _db.Notifications.Add(n);
        await _db.SaveChangesAsync(ct);
    }
}
