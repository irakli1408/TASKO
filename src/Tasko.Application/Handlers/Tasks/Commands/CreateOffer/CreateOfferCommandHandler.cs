using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Realtime;
using Tasko.Application.DTO.Tasks;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Tasks;

namespace Tasko.Application.Handlers.Tasks.Commands.CreateOffer;

public sealed class CreateOfferCommandHandler : IRequestHandler<CreateOfferCommand, OfferDto>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;
    private readonly ITaskRealtime _realtime;

    public CreateOfferCommandHandler(ITaskoDbContext db, ICurrentStateService current, ITaskRealtime realtime)
    {
        _db = db;
        _current = current;
        _realtime = realtime;
    }

    public async Task<OfferDto> Handle(CreateOfferCommand request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
        if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

        var task = await _db.Tasks.FirstOrDefaultAsync(x => x.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Task not found.");

        if (task.Status != Tasko.Domain.Entities.Tasks.TaskStatus.Published)
            throw new InvalidOperationException("Task is not Published.");

        var exists = await _db.Offers.AnyAsync(x => x.TaskId == request.TaskId && x.ExecutorUserId == userId, ct);
        if (exists) throw new InvalidOperationException("You already made an offer for this task.");

        var offer = new Offer(request.TaskId, userId, request.Price, request.Comment?.Trim());

        _db.Offers.Add(offer);
        await _db.SaveChangesAsync(ct);

        var dto = new OfferDto
        {
            Id = offer.Id,
            TaskId = offer.TaskId,
            ExecutorUserId = offer.ExecutorUserId,
            Price = offer.Price,
            Comment = offer.Comment,
            Status = offer.Status.ToString(),
            CreatedAtUtc = offer.CreatedAtUtc
        };

        await _realtime.OfferCreated(request.TaskId, dto, ct);

        return dto;
    }
}
