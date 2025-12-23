using MediatR;

namespace Tasko.Application.Handlers.Auth.Commands.Logout;

public sealed record LogoutCommand(string RefreshToken) : IRequest<Unit>;
