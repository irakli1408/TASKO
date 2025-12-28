using MediatR;
using Tasko.Application.DTO.Profile;

namespace Tasko.Application.Handlers.Profile.Queries.GetMyProfile;

public sealed record GetMyProfileQuery : IRequest<MyProfileDto>;
