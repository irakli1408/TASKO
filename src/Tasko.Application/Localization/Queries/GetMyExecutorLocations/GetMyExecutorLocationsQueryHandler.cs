using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.MyExecutorLocationsDto;
using Tasko.Common.CurrentState;

namespace Tasko.Application.Localization.Queries.GetMyExecutorLocations
{
    public sealed class GetMyExecutorLocationsQueryHandler
    : IRequestHandler<GetMyExecutorLocationsQuery, MyExecutorLocationsDto>
    {
        private readonly ITaskoDbContext _db;
        private readonly ICurrentStateService _current;

        public GetMyExecutorLocationsQueryHandler(ITaskoDbContext db, ICurrentStateService current)
        {
            _db = db;
            _current = current;
        }

        public async Task<MyExecutorLocationsDto> Handle(GetMyExecutorLocationsQuery request, CancellationToken ct)
        {
            if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
            if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

            var items = await _db.ExecutorLocations
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .Select(x => x.LocationType)
                .OrderBy(x => x)
                .ToListAsync(ct);

            return new MyExecutorLocationsDto { LocationTypes = items };
        }
    }
}
