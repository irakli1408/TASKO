using MediatR;

namespace Tasko.Application.Handlers.Auth.Commands.ResetPassword;

public sealed record ResetPasswordCommand(string Token, string NewPassword) : IRequest;
