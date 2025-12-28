using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Application.Handlers.Profile.Commands.UpdateMyExecutorCategories;

public sealed class UpdateMyExecutorCategoriesCommandHandler
    : IRequestHandler<UpdateMyExecutorCategoriesCommand, IReadOnlyList<long>>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;

    public UpdateMyExecutorCategoriesCommandHandler(ITaskoDbContext db, ICurrentStateService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<IReadOnlyList<long>> Handle(UpdateMyExecutorCategoriesCommand request, CancellationToken ct)
    {
        var userId = _current.GetUserIdLong();

        var user = await _db.Users.FirstAsync(x => x.Id == userId, ct);
        if (user.RoleType is UserRoleType.Customer)
            throw new InvalidOperationException("User is not an executor.");

        var desired = (request.CategoryIds ?? Array.Empty<long>())
            .Where(x => x > 0)
            .Distinct()
            .ToHashSet();

        // validate categories exist & active
        if (desired.Count > 0)
        {
            var existingActiveIds = await _db.Categories
                .AsNoTracking()
                .Where(x => x.IsActive && desired.Contains(x.Id))
                .Select(x => x.Id)
                .ToListAsync(ct);

            if (existingActiveIds.Count != desired.Count)
                throw new InvalidOperationException("One or more categories are invalid.");
        }

        var currentLinks = await _db.ExecutorCategories
            .Where(x => x.UserId == userId)
            .ToListAsync(ct);

        var toRemove = currentLinks.Where(x => !desired.Contains(x.CategoryId)).ToList();
        if (toRemove.Count > 0)
            _db.ExecutorCategories.RemoveRange(toRemove);

        var currentSet = currentLinks.Select(x => x.CategoryId).ToHashSet();
        var toAdd = desired.Where(id => !currentSet.Contains(id))
            .Select(id => new ExecutorCategory(userId, id))
            .ToList();

        if (toAdd.Count > 0)
            await _db.ExecutorCategories.AddRangeAsync(toAdd, ct);

        await _db.SaveChangesAsync(ct);

        return desired.OrderBy(x => x).ToList();
    }
}
