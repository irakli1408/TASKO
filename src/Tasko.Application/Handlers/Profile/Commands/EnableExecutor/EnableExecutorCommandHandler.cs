using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.Profile;
using Tasko.Application.Handlers.Profile.Queries.GetMyProfile;
using Tasko.Common.CurrentState;

namespace Tasko.Application.Handlers.Profile.Commands.EnableExecutor;

public sealed class EnableExecutorCommandHandler : IRequestHandler<EnableExecutorCommand, MyProfileDto>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;
    private readonly IMediator _mediator;

    public EnableExecutorCommandHandler(ITaskoDbContext db, ICurrentStateService current, IMediator mediator)
    {
        _db = db;
        _current = current;
        _mediator = mediator;
    }

    public async Task<MyProfileDto> Handle(EnableExecutorCommand request, CancellationToken ct)
    {
        var userId = _current.GetUserIdLong();

        var user = await _db.Users.FirstAsync(x => x.Id == userId, ct);

        user.BecomeExecutor(request.LocationType);
        user.UpdateExecutorProfile(request.ExperienceYears);

        await _db.SaveChangesAsync(ct);

        return await _mediator.Send(new GetMyProfileQuery(), ct);
    }
}
