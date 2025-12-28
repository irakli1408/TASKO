using MediatR;
using Tasko.Application.DTO.Categories;

namespace Tasko.Application.Handlers.Categories.Queries.GetCategoryTree;

public sealed record GetCategoryTreeQuery : IRequest<IReadOnlyList<CategoryTreeDto>>;
