using MediatR;
using Tasko.Application.DTO.Tasks;

namespace Tasko.Application.Handlers.Tasks.Queries.GetMyOffers;

public sealed record GetMyOffersQuery(
    int Skip = 0,
    int Take = 50
) : IRequest<IReadOnlyList<OfferListItemDto>>;
