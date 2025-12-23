using MediatR;
using Tasko.Application.DTO.Auth;

namespace Tasko.Application.Handlers.Auth.Commands.Refresh;

public sealed record RefreshTokenCommand(string RefreshToken) : IRequest<AuthResultDto>;
