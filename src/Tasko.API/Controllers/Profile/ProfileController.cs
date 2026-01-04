using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;
using Tasko.API.Common.Model;
using Tasko.API.Settings;
using Tasko.Application.DTO.Executors;
using Tasko.Application.DTO.MyExecutorLocationsDto;
using Tasko.Application.DTO.Profile;
using Tasko.Application.Handlers.Executors.Queries.GetExecutorPublicProfile;
using Tasko.Application.Handlers.Profile.Commands.DisableExecutor;
using Tasko.Application.Handlers.Profile.Commands.EnableExecutor;
using Tasko.Application.Handlers.Profile.Commands.UpdateExecutorProfile;
using Tasko.Application.Handlers.Profile.Commands.UpdateMyAvatar;
using Tasko.Application.Handlers.Profile.Commands.UpdateMyProfile;
using Tasko.Application.Handlers.Profile.Queries.GetMyProfile;
using Tasko.Application.Localization.Queries.GetMyExecutorLocations;
using Tasko.Application.Localization.Queries.UpdateMyExecutorLocations;
using Tasko.Application.Media;

namespace Tasko.API.Controllers.Profile;

[ApiController]
[Authorize]
[Route("api/v1/[controller]")]
[EnableRateLimiting("write")]
public sealed class ProfileController : ApiControllerBase
{
    private readonly IOutputCacheStore _cache;
    public ProfileController(ISender sender, IOutputCacheStore cache) : base(sender) { _cache = cache; }
    

    [HttpGet("me")]
    [EnableRateLimiting("read")]
    public Task<MyProfileDto> GetMe(CancellationToken ct)
        => Sender.Send(new GetMyProfileQuery(), ct);

    [HttpPatch("me")]
    public async Task<MyProfileDto> UpdateMe([FromBody] UpdateMyProfileCommand command, CancellationToken ct)
    {
        var result = await Sender.Send(command, ct);

        await _cache.EvictByTagAsync("profiles", ct);
        await _cache.EvictByTagAsync("feed", ct); 

        return result;
    }

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
    [AllowAnonymous]
    [EnableRateLimiting("read")]
    public Task<ExecutorPublicProfileDto> ExecutorProfileByIdForCustomer([FromRoute] long id, CancellationToken ct)
        => Sender.Send(new GetExecutorPublicProfileQuery(id), ct);

    [HttpGet("me/executor/locations")]
    [EnableRateLimiting("read")]
    public Task<MyExecutorLocationsDto> GetMine(CancellationToken ct)
        => Sender.Send(new GetMyExecutorLocationsQuery(), ct);

    [HttpPut("me/executor/locations")]
    public async Task<MyExecutorLocationsDto> UpdateMine([FromBody] UpdateMyExecutorLocationsRequest body, CancellationToken ct)
    {
        var result = await Sender.Send(new UpdateMyExecutorLocationsCommand(body.LocationTypes), ct);

        await _cache.EvictByTagAsync("feed", ct);
        await _cache.EvictByTagAsync("profiles", ct);

        return result;
    }

    [HttpPost("me/avatar")]
    [Authorize]
    [Consumes("multipart/form-data")]
    public async Task<MyProfileDto> UpdateAvatar([FromForm] UploadAvatarForm form, CancellationToken ct)
    {
        if (form.File is null || form.File.Length == 0)
            throw new ArgumentException("No file provided.");

        var file = new UploadFile(
            Content: form.File.OpenReadStream(),
            FileName: form.File.FileName,
            ContentType: form.File.ContentType,
            Length: form.File.Length);

        var result = await Sender.Send(new UpdateMyAvatarCommand(file), ct);

        await _cache.EvictByTagAsync("profiles", ct);
        await _cache.EvictByTagAsync("feed", ct);

        return result;
    }
}
