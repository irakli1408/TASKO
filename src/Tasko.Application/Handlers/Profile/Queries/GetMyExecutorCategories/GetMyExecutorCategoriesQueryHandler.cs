using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Application.Handlers.Profile.Queries.GetMyExecutorCategories;

public sealed class GetMyExecutorCategoriesQueryHandler
    : IRequestHandler<GetMyExecutorCategoriesQuery, IReadOnlyList<long>>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;

    public GetMyExecutorCategoriesQueryHandler(ITaskoDbContext db, ICurrentStateService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<IReadOnlyList<long>> Handle(GetMyExecutorCategoriesQuery request, CancellationToken ct)
    {
        var userId = _current.GetUserIdLong();

        var user = await _db.Users.AsNoTracking().FirstAsync(x => x.Id == userId, ct);
        if (user.RoleType is UserRoleType.Customer)
            throw new InvalidOperationException("User is not an executor.");

        return await _db.ExecutorCategories
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => x.CategoryId)
            .OrderBy(x => x)
            .ToListAsync(ct);
    }
}
