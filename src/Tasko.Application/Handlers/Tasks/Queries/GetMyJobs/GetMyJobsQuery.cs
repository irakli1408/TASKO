using MediatR;
using Tasko.Application.DTO.Tasks;

namespace Tasko.Application.Handlers.Tasks.Queries.GetMyJobs;

public sealed record GetMyJobsQuery(
    int Skip = 0,
    int Take = 50
) : IRequest<IReadOnlyList<MyJobListItemDto>>;
