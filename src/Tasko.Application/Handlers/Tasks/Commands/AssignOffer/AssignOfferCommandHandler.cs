using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Realtime;
using Tasko.Application.Abstractions.Services;
using Tasko.Common.CurrentState;

namespace Tasko.Application.Handlers.Tasks.Commands.AssignOffer;

public sealed class AssignOfferCommandHandler : IRequestHandler<AssignOfferCommand>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;
    private readonly ITaskRealtime _realtime;
    private readonly INotificationService _notificationService;

    public AssignOfferCommandHandler(
        ITaskoDbContext db,
        ICurrentStateService current,
        ITaskRealtime realtime,
        INotificationService notificationService)
    {
        _db = db;
        _current = current;
        _realtime = realtime;
        _notificationService = notificationService;
    }

    public async Task Handle(AssignOfferCommand request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
        if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

        var task = await _db.Tasks.FirstOrDefaultAsync(x => x.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Task not found.");

        if (task.CreatedByUserId != userId) throw new UnauthorizedAccessException();

        var offer = await _db.Offers.FirstOrDefaultAsync(x => x.Id == request.OfferId && x.TaskId == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Offer not found.");

        offer.Accept();
        task.Assign(offer.ExecutorUserId);

        await _db.SaveChangesAsync(ct);

        // 🔔 TaskAssigned → заказчику + мастеру
        await _notificationService.NotifyTaskAssignedAsync(
            taskId: task.Id,
            customerUserId: task.CreatedByUserId,
            executorUserId: offer.ExecutorUserId,
            ct: ct);

        await _realtime.TaskAssigned(task.Id, offer.ExecutorUserId, ct);
    }
}
