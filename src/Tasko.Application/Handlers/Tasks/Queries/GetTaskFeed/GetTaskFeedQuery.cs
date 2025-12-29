using MediatR;
using Tasko.Application.DTO.Tasks;
using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Application.Handlers.Tasks.Queries.GetTaskFeed;

public sealed record GetTaskFeedQuery(int Skip = 0, int Take = 50, LocationType? LocationType = null)
    : IRequest<IReadOnlyList<TaskFeedItemDto>>;
