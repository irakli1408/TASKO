using MediatR;
using Microsoft.AspNetCore.Mvc;
using Tasko.API.Settings;
using Tasko.Application.DTO.Executors;
using Tasko.Application.DTO.MyExecutorLocationsDto;
using Tasko.Application.DTO.Profile;
using Tasko.Application.Handlers.Executors.Queries.GetExecutorPublicProfile;
using Tasko.Application.Handlers.Profile.Commands.DisableExecutor;
using Tasko.Application.Handlers.Profile.Commands.EnableExecutor;
using Tasko.Application.Handlers.Profile.Commands.UpdateExecutorProfile;
using Tasko.Application.Handlers.Profile.Commands.UpdateMyProfile;
using Tasko.Application.Handlers.Profile.Queries.GetMyProfile;
using Tasko.Application.Localization.Queries.GetMyExecutorLocations;
using Tasko.Application.Localization.Queries.UpdateMyExecutorLocations;

namespace Tasko.API.Controllers.Profile;

[ApiController]
[Route("api/v1/[controller]")]
public sealed class ProfileController : ApiControllerBase
{
    public ProfileController(ISender sender) : base(sender) { }
    

    [HttpGet("me")]
    public Task<MyProfileDto> GetMe(CancellationToken ct)
        => Sender.Send(new GetMyProfileQuery(), ct);

    [HttpPatch("me")]
    public Task<MyProfileDto> UpdateMe([FromBody] UpdateMyProfileCommand command, CancellationToken ct)
        => Sender.Send(command, ct);

    [HttpPut("me/executor/enable")]
    public Task<MyProfileDto> EnableExecutor([FromBody] EnableExecutorCommand command, CancellationToken ct)
        => Sender.Send(command, ct);

    [HttpPut("me/executor/disable")]
    public Task<MyProfileDto> DisableExecutor(CancellationToken ct)
        => Sender.Send(new DisableExecutorCommand(), ct);

    [HttpPut("me/executor")]
    public Task<MyProfileDto> UpdateExecutor([FromBody] UpdateExecutorProfileCommand command, CancellationToken ct)
        => Sender.Send(command, ct);

    [HttpGet("{id:long}")]
    public Task<ExecutorPublicProfileDto> ExecutorProfileByIdForCustomer([FromRoute] long id, CancellationToken ct)
        => Sender.Send(new GetExecutorPublicProfileQuery(id), ct);

    [HttpGet("me/executor/locations")]
    public Task<MyExecutorLocationsDto> GetMine(CancellationToken ct)
        => Sender.Send(new GetMyExecutorLocationsQuery(), ct);

    [HttpPut("me/executor/locations")]
    public Task<MyExecutorLocationsDto> UpdateMine([FromBody] UpdateMyExecutorLocationsRequest body, CancellationToken ct)
       => Sender.Send(new UpdateMyExecutorLocationsCommand(body.LocationTypes), ct);

}
