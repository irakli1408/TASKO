using MediatR;
using Tasko.Application.DTO.Tasks;

namespace Tasko.Application.Handlers.Tasks.Commands.CreateOffer;

public sealed record CreateOfferCommand(long TaskId, decimal Price, string? Comment) : IRequest<OfferDto>;
