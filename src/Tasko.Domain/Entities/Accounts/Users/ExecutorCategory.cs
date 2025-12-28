using Tasko.Domain.Entities.Categories;

namespace Tasko.Domain.Entities.Accounts.Users;

public sealed class ExecutorCategory
{
    private ExecutorCategory() { }

    public ExecutorCategory(long userId, long categoryId)
    {
        UserId = userId;
        CategoryId = categoryId;
    }

    public long UserId { get; private set; }
    public long CategoryId { get; private set; }

    public User User { get; private set; } = null!;
    public Category Category { get; private set; } = null!;
}
