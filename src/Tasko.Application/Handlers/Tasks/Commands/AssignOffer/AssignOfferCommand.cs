using MediatR;

namespace Tasko.Application.Handlers.Tasks.Commands.AssignOffer;

public sealed record AssignOfferCommand(long TaskId, long OfferId) : IRequest;
