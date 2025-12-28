using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.Profile;
using Tasko.Application.Handlers.Profile.Queries.GetMyProfile;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Application.Handlers.Profile.Commands.UpdateExecutorProfile;

public sealed class UpdateExecutorProfileCommandHandler : IRequestHandler<UpdateExecutorProfileCommand, MyProfileDto>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;
    private readonly IMediator _mediator;

    public UpdateExecutorProfileCommandHandler(ITaskoDbContext db, ICurrentStateService current, IMediator mediator)
    {
        _db = db;
        _current = current;
        _mediator = mediator;
    }

    public async Task<MyProfileDto> Handle(UpdateExecutorProfileCommand request, CancellationToken ct)
    {
        var userId = _current.GetUserIdLong();

        var user = await _db.Users.FirstAsync(x => x.Id == userId, ct);

        if (user.RoleType is UserRoleType.Customer)
            throw new InvalidOperationException("User is not an executor.");

        user.UpdateExecutorProfile(request.ExperienceYears);

        await _db.SaveChangesAsync(ct);

        return await _mediator.Send(new GetMyProfileQuery(), ct);
    }
}
