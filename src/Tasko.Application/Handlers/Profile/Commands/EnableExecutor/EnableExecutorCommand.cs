using MediatR;
using Tasko.Application.DTO.Profile;
using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Application.Handlers.Profile.Commands.EnableExecutor;

public sealed record EnableExecutorCommand(
    LocationType LocationType,
    int? ExperienceYears
) : IRequest<MyProfileDto>;
