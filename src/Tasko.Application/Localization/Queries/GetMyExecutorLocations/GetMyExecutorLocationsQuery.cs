using MediatR;
using Tasko.Application.DTO.MyExecutorLocationsDto;

namespace Tasko.Application.Localization.Queries.GetMyExecutorLocations
{
    public sealed record GetMyExecutorLocationsQuery() : IRequest<MyExecutorLocationsDto>;
}
