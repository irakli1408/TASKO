using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.Profile;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Application.Handlers.Profile.Queries.GetMyProfile;

public sealed class GetMyProfileQueryHandler : IRequestHandler<GetMyProfileQuery, MyProfileDto>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;

    public GetMyProfileQueryHandler(ITaskoDbContext db, ICurrentStateService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<MyProfileDto> Handle(GetMyProfileQuery request, CancellationToken ct)
    {
        // Replace GetUserIdLong() if your CurrentState uses another name.
        var userId = _current.GetUserIdLong();

        var data = await (
     from u in _db.Users.AsNoTracking()
     where u.Id == userId
     join el in _db.ExecutorLocations.AsNoTracking()
         on u.Id equals el.UserId into els
     select new
     {
         User = u,
         ExecutorLocationTypes = els.Select(x => (int)x.LocationType).ToList()
     }
 ).FirstAsync(ct);

        var user = data.User;

        var canBeExecutor = user.RoleType is UserRoleType.Executor or UserRoleType.Both;

        return new MyProfileDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Phone = user.Phone,
            AvatarUrl = user.AvatarUrl,
            About = user.About,

            RoleType = user.RoleType,
            IsExecutorActive = user.IsExecutorActive,

            LocationType = user.LocationType, 
            ExecutorLocationTypes = data.ExecutorLocationTypes,

            RatingAverage = user.RatingAverage,
            RatingCount = user.RatingCount,

            Executor = canBeExecutor ? new ExecutorSectionDto
            {
                ExperienceYears = user.ExperienceYears
            } : null
        };
    }
}
