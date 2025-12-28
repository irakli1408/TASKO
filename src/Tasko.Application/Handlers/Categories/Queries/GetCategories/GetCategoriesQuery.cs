using MediatR;
using Tasko.Application.DTO.Categories;

namespace Tasko.Application.Handlers.Categories.Queries.GetCategories;

public sealed record GetCategoriesQuery : IRequest<IReadOnlyList<CategoryDto>>;
