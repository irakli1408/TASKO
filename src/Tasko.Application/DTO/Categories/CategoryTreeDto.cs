namespace Tasko.Application.DTO.Categories;

public sealed class CategoryTreeDto
{
    public long Id { get; set; }
    public string Name { get; set; } = null!;
    public List<CategoryTreeDto> Children { get; set; } = new();
}
