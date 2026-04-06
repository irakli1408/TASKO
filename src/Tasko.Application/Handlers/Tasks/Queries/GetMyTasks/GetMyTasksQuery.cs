using MediatR;
using Tasko.Application.DTO.Tasks;

namespace Tasko.Application.Handlers.Tasks.Queries.GetMyTasks;

public sealed record GetMyTasksQuery(int Skip = 0, int Take = 50) : IRequest<IReadOnlyList<TaskDto>>;
