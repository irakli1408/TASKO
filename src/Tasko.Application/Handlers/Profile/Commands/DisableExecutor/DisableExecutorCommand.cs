using MediatR;
using Tasko.Application.DTO.Profile;

namespace Tasko.Application.Handlers.Profile.Commands.DisableExecutor;

public sealed record DisableExecutorCommand : IRequest<MyProfileDto>;
