using MediatR;
using Tasko.Application.DTO.Profile;

namespace Tasko.Application.Handlers.Profile.Commands.UpdateMyProfile;

public sealed record UpdateMyProfileCommand(
    string FirstName,
    string LastName,
    string Phone,
    string? About,
    string? AvatarUrl
) : IRequest<MyProfileDto>;
