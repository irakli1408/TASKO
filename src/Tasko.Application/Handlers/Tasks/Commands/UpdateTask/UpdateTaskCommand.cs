using MediatR;
using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Application.Handlers.Tasks.Commands.UpdateTask;

public sealed record UpdateTaskCommand(
    long TaskId,
    string? Title,
    string? Description,
    decimal? Budget,
    long? CategoryId,
    LocationType? LocationType
) : IRequest;
