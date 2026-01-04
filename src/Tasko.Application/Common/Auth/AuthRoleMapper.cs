using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Application.Common.Auth;

public static class AuthRoleMapper
{
    public static IReadOnlyList<string> FromUser(User user)
        => FromRoleType(user.RoleType);

    public static IReadOnlyList<string> FromRoleType(UserRoleType roleType)
        => roleType switch
        {
            UserRoleType.Customer => new[] { "Customer" },
            UserRoleType.Executor => new[] { "Executor" },
            UserRoleType.Both => new[] { "Customer", "Executor" },
            _ => Array.Empty<string>()
        };
}
