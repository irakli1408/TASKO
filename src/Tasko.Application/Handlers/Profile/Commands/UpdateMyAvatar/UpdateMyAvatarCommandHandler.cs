using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Services;
using Tasko.Application.DTO.Profile;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Media;

namespace Tasko.Application.Handlers.Profile.Commands.UpdateMyAvatar;

public sealed class UpdateMyAvatarCommandHandler : IRequestHandler<UpdateMyAvatarCommand, MyProfileDto>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;
    private readonly IMediaService _media;

    public UpdateMyAvatarCommandHandler(ITaskoDbContext db, ICurrentStateService current, IMediaService media)
    {
        _db = db;
        _current = current;
        _media = media;
    }

    public async Task<MyProfileDto> Handle(UpdateMyAvatarCommand request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
        if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == userId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        // delete previous avatar mapping(s)
        var oldMaps = await _db.FileMaps
            .Where(x => x.OwnerType == MediaOwnerType.UserAvatar && x.OwnerId == userId)
            .ToListAsync(ct);

        foreach (var m in oldMaps)
            _db.FileMaps.Remove(m);

        await _db.SaveChangesAsync(ct);

        foreach (var m in oldMaps)
            await _media.DeleteFileIfOrphanAsync(m.FileId, ct);

        // save new avatar
        await using (request.File.Content)
        {
            var saved = await _media.SaveImageAsync(
                createdByUserId: userId,
                relativeFolder: $"uploads/avatars/{userId}",
                file: request.File,
                ct: ct);

            _db.FileMaps.Add(new FileMap(MediaOwnerType.UserAvatar, userId, saved.Id, sortOrder: 0));

            var url = _media.ToPublicUrl(saved.StoragePath);
            user.SetAvatar(url);

            await _db.SaveChangesAsync(ct);
        }

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
            ExecutorLocationTypes = new(),
            RatingAverage = user.RatingAverage,
            RatingCount = user.RatingCount,
            Executor = user.ExperienceYears is null ? null : new ExecutorSectionDto { ExperienceYears = user.ExperienceYears }
        };
    }
}
