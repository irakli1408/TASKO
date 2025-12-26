using MediatR;
using Tasko.Application.DTO.Tasks;

namespace Tasko.Application.Handlers.Tasks.Queries.GetTaskStats;

public sealed record GetTaskStatsQuery(long TaskId) : IRequest<TaskStatsDto>;
