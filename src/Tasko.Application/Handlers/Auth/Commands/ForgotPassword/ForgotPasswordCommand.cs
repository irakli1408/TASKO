using MediatR;

namespace Tasko.Application.Handlers.Auth.Commands.ForgotPassword;

public sealed record ForgotPasswordCommand(string Email) : IRequest;
