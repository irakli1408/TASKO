using MediatR;
using Tasko.Application.DTO.Profile;

namespace Tasko.Application.Handlers.Profile.Commands.UpdateExecutorProfile;

public sealed record UpdateExecutorProfileCommand(int? ExperienceYears) : IRequest<MyProfileDto>;
