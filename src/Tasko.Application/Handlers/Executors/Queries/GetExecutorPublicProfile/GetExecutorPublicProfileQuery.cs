using MediatR;
using Tasko.Application.DTO.Executors;

namespace Tasko.Application.Handlers.Executors.Queries.GetExecutorPublicProfile;

public sealed record GetExecutorPublicProfileQuery(long Id) : IRequest<ExecutorPublicProfileDto>;
