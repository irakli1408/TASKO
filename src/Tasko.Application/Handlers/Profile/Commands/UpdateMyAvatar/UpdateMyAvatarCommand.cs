using MediatR;
using Tasko.Application.DTO.Profile;
using Tasko.Application.Media;

namespace Tasko.Application.Handlers.Profile.Commands.UpdateMyAvatar;

public sealed record UpdateMyAvatarCommand(UploadFile File) : IRequest<MyProfileDto>;
