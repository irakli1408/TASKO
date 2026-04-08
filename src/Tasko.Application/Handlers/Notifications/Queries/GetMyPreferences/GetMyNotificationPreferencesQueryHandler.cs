using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.Notifications;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Notifications;

namespace Tasko.Application.Handlers.Notifications.Queries.GetMyPreferences;

public sealed class GetMyNotificationPreferencesQueryHandler
    : IRequestHandler<GetMyNotificationPreferencesQuery, NotificationPreferencesDto>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;

    public GetMyNotificationPreferencesQueryHandler(ITaskoDbContext db, ICurrentStateService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<NotificationPreferencesDto> Handle(GetMyNotificationPreferencesQuery request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated)
            throw new UnauthorizedAccessException();

        if (!long.TryParse(_current.UserId, out var userId))
            throw new UnauthorizedAccessException();

        var preferences = await _db.NotificationPreferences
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId, ct);

        if (preferences is null)
        {
            var created = new NotificationPreference(userId);
            _db.NotificationPreferences.Add(created);
            await _db.SaveChangesAsync(ct);
            preferences = created;
        }

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
