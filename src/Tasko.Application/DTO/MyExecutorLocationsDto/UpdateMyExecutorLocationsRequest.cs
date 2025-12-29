using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Application.DTO.MyExecutorLocationsDto
{
    public sealed class UpdateMyExecutorLocationsRequest
    {
        public List<LocationType> LocationTypes { get; set; } = new();
    }
}
