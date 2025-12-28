namespace Tasko.Domain.Entities.Categories;

public sealed class Category
{
    private Category() { }

    public Category(string name)
    {
        Name = name;
        IsActive = true;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public long Id { get; private set; }
    public string Name { get; private set; } = null!;
    public bool IsActive { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public void Rename(string name) => Name = name;
    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;
}
