using MediatR;
using Tasko.Application.DTO.Tasks;
using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Application.Handlers.Tasks.Commands.CreateTask;

public sealed record CreateTaskCommand(
    string Title,
    string? Description,
    decimal? Budget,
    long CategoryId,
    LocationType LocationType
) : IRequest<TaskDto>;
