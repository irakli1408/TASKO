using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.Categories;

namespace Tasko.Application.Handlers.Categories.Queries.GetCategoryTree;

public sealed class GetCategoryTreeQueryHandler
    : IRequestHandler<GetCategoryTreeQuery, IReadOnlyList<CategoryTreeDto>>
{
    private readonly ITaskoDbContext _db;

    public GetCategoryTreeQueryHandler(ITaskoDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<CategoryTreeDto>> Handle(GetCategoryTreeQuery request, CancellationToken ct)
    {
        var rows = await _db.Categories
            .AsNoTracking()
            .Where(x => x.IsActive)
            .Select(x => new { x.Id, x.Name, x.ParentId })
            .ToListAsync(ct);

        var dict = rows.ToDictionary(
            x => x.Id,
            x => new CategoryTreeDto { Id = x.Id, Name = x.Name }
        );

        foreach (var r in rows)
        {
            if (r.ParentId is null) continue;
            if (dict.TryGetValue(r.ParentId.Value, out var parent))
                parent.Children.Add(dict[r.Id]);
        }

        var roots = rows
            .Where(x => x.ParentId is null)
            .Select(x => dict[x.Id])
            .ToList();

        SortRecursive(roots);

        return roots;
    }

    private static void SortRecursive(List<CategoryTreeDto> nodes)
    {
        nodes.Sort((a, b) => string.Compare(a.Name, b.Name, StringComparison.OrdinalIgnoreCase));

        foreach (var n in nodes)
            if (n.Children.Count > 0)
                SortRecursive(n.Children);
    }
}
