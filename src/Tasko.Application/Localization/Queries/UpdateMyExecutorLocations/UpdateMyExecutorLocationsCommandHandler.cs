using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.MyExecutorLocationsDto;
using Tasko.Application.Localization.Queries.UpdateMyExecutorLocations;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Application.Handlers.Locations.Commands.UpdateMyExecutorLocations;

public sealed class UpdateMyExecutorLocationsCommandHandler
    : IRequestHandler<UpdateMyExecutorLocationsCommand, MyExecutorLocationsDto>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;

    public UpdateMyExecutorLocationsCommandHandler(ITaskoDbContext db, ICurrentStateService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<MyExecutorLocationsDto> Handle(UpdateMyExecutorLocationsCommand request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
        if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

        var distinct = request.LocationTypes.Distinct().ToList();

        var existing = await _db.ExecutorLocations
            .Where(x => x.UserId == userId)
            .ToListAsync(ct);

        _db.ExecutorLocations.RemoveRange(existing);

        var toAdd = distinct
            .Select(loc => new ExecutorLocation(userId, loc))
            .ToList();

        _db.ExecutorLocations.AddRange(toAdd);
        await _db.SaveChangesAsync(ct);

        return new MyExecutorLocationsDto
        {
            LocationTypes = toAdd.Select(x => x.LocationType).OrderBy(x => x).ToList()
        };
    }
}
