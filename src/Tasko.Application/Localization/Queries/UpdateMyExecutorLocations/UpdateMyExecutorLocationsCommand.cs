using MediatR;
using Tasko.Application.DTO.MyExecutorLocationsDto;
using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Application.Localization.Queries.UpdateMyExecutorLocations
{
    public sealed record UpdateMyExecutorLocationsCommand(List<LocationType> LocationTypes)
        : IRequest<MyExecutorLocationsDto>;
}
