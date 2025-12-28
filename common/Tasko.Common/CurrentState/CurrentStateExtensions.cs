using System.Globalization;

namespace Tasko.Common.CurrentState;

public static class CurrentStateExtensions
{
    public static long GetUserIdLong(this ICurrentStateService current)
    {
        var raw = current.UserId;

        if (string.IsNullOrWhiteSpace(raw))
            throw new InvalidOperationException("Unauthorized: user id is missing.");

        if (!long.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var id))
            throw new InvalidOperationException("Unauthorized: invalid user id.");

        return id;
    }
}
