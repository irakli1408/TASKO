namespace Tasko.Domain.Entities.Accounts.Users;

public sealed class ExecutorLocation
{
    private ExecutorLocation() { }

    public ExecutorLocation(long userId, LocationType locationType)
    {
        UserId = userId;
        LocationType = locationType;
    }

    public long UserId { get; private set; }
    public LocationType LocationType { get; private set; }

    public User User { get; private set; } = null!;
}
