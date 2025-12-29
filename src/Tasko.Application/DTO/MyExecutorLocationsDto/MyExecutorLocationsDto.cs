using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Application.DTO.MyExecutorLocationsDto
{
    public sealed class MyExecutorLocationsDto
    {
        public IReadOnlyList<LocationType> LocationTypes { get; set; } = Array.Empty<LocationType>();
    }
}
