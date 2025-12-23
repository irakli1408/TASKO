using MediatR;
using Tasko.Application.DTO.Auth;

namespace Tasko.Application.Handlers.Auth.Queries.Me;

public sealed record MeQuery() : IRequest<UserDto>;
