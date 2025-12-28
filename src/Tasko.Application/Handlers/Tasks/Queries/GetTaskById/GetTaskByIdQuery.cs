using MediatR;
using Tasko.Application.DTO.Tasks;

namespace Tasko.Application.Handlers.Tasks.Queries.GetTaskById;

public sealed record GetTaskByIdQuery(long TaskId) : IRequest<TaskDetailsDto>;
