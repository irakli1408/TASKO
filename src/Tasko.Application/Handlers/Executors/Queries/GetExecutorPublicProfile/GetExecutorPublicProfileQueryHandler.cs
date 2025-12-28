using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.Executors;
using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Application.Handlers.Executors.Queries.GetExecutorPublicProfile;

public sealed class GetExecutorPublicProfileQueryHandler
    : IRequestHandler<GetExecutorPublicProfileQuery, ExecutorPublicProfileDto>
{
    private readonly ITaskoDbContext _db;

    public GetExecutorPublicProfileQueryHandler(ITaskoDbContext db)
    {
        _db = db;
    }

    public async Task<ExecutorPublicProfileDto> Handle(GetExecutorPublicProfileQuery request, CancellationToken ct)
    {
        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.Id && x.IsActive, ct);

        if (user is null)
            throw new InvalidOperationException("Executor not found.");

        // public profile only if user can be executor (Executor/Both)
        if (user.RoleType is not (UserRoleType.Executor or UserRoleType.Both))
            throw new InvalidOperationException("Executor not found.");

        // If you want ONLY active executors visible - enable this:
        // if (!user.IsExecutorActive) throw new InvalidOperationException("Executor not found.");

        return new ExecutorPublicProfileDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            AvatarUrl = user.AvatarUrl,
            About = user.About,

            RatingAverage = user.RatingAverage,
            RatingCount = user.RatingCount,

            LocationType = user.LocationType,
            ExperienceYears = user.ExperienceYears,

            CategoryIds = Array.Empty<long>() // TODO: categories
        };
    }
}
