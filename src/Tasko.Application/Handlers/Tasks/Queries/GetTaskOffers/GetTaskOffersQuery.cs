using MediatR;
using Tasko.Application.DTO.Tasks;

namespace Tasko.Application.Handlers.Tasks.Queries.GetTaskOffers;

public sealed record GetTaskOffersQuery(long TaskId, int Skip = 0, int Take = 50) : IRequest<IReadOnlyList<OfferDto>>;
