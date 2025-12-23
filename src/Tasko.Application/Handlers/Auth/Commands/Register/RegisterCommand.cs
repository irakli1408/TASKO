using MediatR;
using Tasko.Application.DTO.Auth;

namespace Tasko.Application.Handlers.Auth.Commands.Register;

public sealed record RegisterCommand(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string Phone
) : IRequest<AuthResultDto>;
