using MediatR;
using Microsoft.AspNetCore.Mvc;
using Tasko.API.Settings;
using Tasko.Application.DTO.Profile;
using Tasko.Application.Handlers.Profile.Commands.DisableExecutor;
using Tasko.Application.Handlers.Profile.Commands.EnableExecutor;
using Tasko.Application.Handlers.Profile.Commands.UpdateExecutorProfile;
using Tasko.Application.Handlers.Profile.Commands.UpdateMyProfile;
using Tasko.Application.Handlers.Profile.Queries.GetMyProfile;

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
}
