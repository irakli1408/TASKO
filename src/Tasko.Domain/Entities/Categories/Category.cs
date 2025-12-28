namespace Tasko.Domain.Entities.Categories;

public sealed class Category
{
    private Category() { }

    public Category(string name, long? parentId = null)
    {
        Name = name;
        ParentId = parentId;

        IsActive = true;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public long Id { get; private set; }

    public string Name { get; private set; } = null!;
    public bool IsActive { get; private set; }

    // hierarchy
    public long? ParentId { get; private set; }
    public Category? Parent { get; private set; }
    public List<Category> Children { get; private set; } = new();

    public DateTime CreatedAtUtc { get; private set; }

    public void Rename(string name) => Name = name;

    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;
}
