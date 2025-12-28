using MediatR;
using Tasko.Application.DTO.Tasks;

namespace Tasko.Application.Handlers.Tasks.Commands.CreateTask;

public sealed record CreateTaskCommand(string Title, string? Description, decimal? Budget, long CategoryId)
    : IRequest<TaskDto>;