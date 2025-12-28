using MediatR;

namespace Tasko.Application.Handlers.Profile.Queries.GetMyExecutorCategories;

public sealed record GetMyExecutorCategoriesQuery : IRequest<IReadOnlyList<long>>;
