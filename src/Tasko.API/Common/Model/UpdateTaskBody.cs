using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.API.Common.Model
{
    public sealed class UpdateTaskBody
    {
        public string? Title { get; init; }
        public string? Description { get; init; }
        public decimal? Budget { get; init; }
        public long? CategoryId { get; init; }
        public LocationType? LocationType { get; init; }
    }
}
