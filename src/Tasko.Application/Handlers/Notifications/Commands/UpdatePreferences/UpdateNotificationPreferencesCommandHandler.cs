using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.Notifications;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Notifications;

namespace Tasko.Application.Handlers.Notifications.Commands.UpdatePreferences;

public sealed class UpdateNotificationPreferencesCommandHandler
    : IRequestHandler<UpdateNotificationPreferencesCommand, NotificationPreferencesDto>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;

    public UpdateNotificationPreferencesCommandHandler(ITaskoDbContext db, ICurrentStateService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<NotificationPreferencesDto> Handle(UpdateNotificationPreferencesCommand request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated)
            throw new UnauthorizedAccessException();

        if (!long.TryParse(_current.UserId, out var userId))
            throw new UnauthorizedAccessException();

        var preferences = await _db.NotificationPreferences
            .FirstOrDefaultAsync(x => x.UserId == userId, ct);

        if (preferences is null)
        {
            preferences = new NotificationPreference(userId);
            _db.NotificationPreferences.Add(preferences);
        }

        preferences.Update(
            request.NotifyNewOffers,
            request.NotifyTaskAssigned,
            request.NotifyNewMessages,
            request.NotifyTaskCompleted,
            request.NotifyMarketplaceUpdates
        );

        await _db.SaveChangesAsync(ct);

        return new NotificationPreferencesDto
        {
            NotifyNewOffers = preferences.NotifyNewOffers,
            NotifyTaskAssigned = preferences.NotifyTaskAssigned,
            NotifyNewMessages = preferences.NotifyNewMessages,
            NotifyTaskCompleted = preferences.NotifyTaskCompleted,
            NotifyMarketplaceUpdates = preferences.NotifyMarketplaceUpdates
        };
    }
}
