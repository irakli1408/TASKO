using MediatR;
using Tasko.Application.DTO.Auth;

namespace Tasko.Application.Handlers.Auth.Commands.Login;

public sealed record LoginCommand(string Email, string Password) : IRequest<AuthResultDto>;
