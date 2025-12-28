using MediatR;

namespace Tasko.Application.Handlers.Profile.Commands.UpdateMyExecutorCategories;

public sealed record UpdateMyExecutorCategoriesCommand(IReadOnlyList<long> CategoryIds)
    : IRequest<IReadOnlyList<long>>;
