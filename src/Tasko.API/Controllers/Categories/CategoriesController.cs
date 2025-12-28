using MediatR;
using Microsoft.AspNetCore.Mvc;
using Tasko.API.Settings;
using Tasko.Application.DTO.Categories;
using Tasko.Application.Handlers.Categories.Queries.GetCategories;
using Tasko.Application.Handlers.Categories.Queries.GetCategoryTree;
using Tasko.Application.Handlers.Profile.Commands.UpdateMyExecutorCategories;
using Tasko.Application.Handlers.Profile.Queries.GetMyExecutorCategories;

namespace Tasko.API.Controllers.Categories;

[ApiController]
[Route("api/v1/[controller]")]
public sealed class CategoriesController : ApiControllerBase
{
    public CategoriesController(ISender sender) : base(sender) { }

    [HttpGet]
    public Task<IReadOnlyList<CategoryDto>> GetAll(CancellationToken ct)
        => Sender.Send(new GetCategoriesQuery(), ct);

    [HttpGet("tree")]
    public Task<IReadOnlyList<CategoryTreeDto>> GetTree(CancellationToken ct)
    => Sender.Send(new GetCategoryTreeQuery(), ct);

    [HttpGet("me/executor/categories")]
    public Task<IReadOnlyList<long>> GetMyExecutorCategories(CancellationToken ct)
    => Sender.Send(new GetMyExecutorCategoriesQuery(), ct);

    [HttpPut("me/executor/categories")]
    public Task<IReadOnlyList<long>> UpdateMyExecutorCategories(
        [FromBody] UpdateMyExecutorCategoriesCommand command,
        CancellationToken ct)
        => Sender.Send(command, ct);
}
