using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;
using Tasko.API.Settings;
using Tasko.Application.DTO.Categories;
using Tasko.Application.Handlers.Categories.Queries.GetCategories;
using Tasko.Application.Handlers.Categories.Queries.GetCategoryTree;
using Tasko.Application.Handlers.Profile.Commands.UpdateMyExecutorCategories;
using Tasko.Application.Handlers.Profile.Queries.GetMyExecutorCategories;

namespace Tasko.API.Controllers.Categories;

[ApiController]
[Route("api/v1/[controller]")]
[EnableRateLimiting("read")]
public sealed class CategoriesController : ApiControllerBase
{
    private readonly IOutputCacheStore _cache;
    public CategoriesController(ISender sender, IOutputCacheStore cache) : base(sender) { _cache = cache; }

    [HttpGet]
    [OutputCache(PolicyName = "PublicCategories5m")]
    public Task<IReadOnlyList<CategoryDto>> GetAll(CancellationToken ct)
        => Sender.Send(new GetCategoriesQuery(), ct);

    [HttpGet("tree")]
    [OutputCache(PolicyName = "PublicCategories5m")]
    public Task<IReadOnlyList<CategoryTreeDto>> GetTree(CancellationToken ct)
    => Sender.Send(new GetCategoryTreeQuery(), ct);

    [HttpGet("me/executor/categories")]
    [Authorize]
    public Task<IReadOnlyList<long>> GetMyExecutorCategories(CancellationToken ct)
    => Sender.Send(new GetMyExecutorCategoriesQuery(), ct);

    [HttpPut("me/executor/categories")]
    [EnableRateLimiting("write")]
    [Authorize]
    public async Task<IReadOnlyList<long>> UpdateMyExecutorCategories(
        [FromBody] UpdateMyExecutorCategoriesCommand command,
        CancellationToken ct)
    {
        var result = await Sender.Send(command, ct);

        await _cache.EvictByTagAsync("feed", ct);
        await _cache.EvictByTagAsync("profiles", ct);

        return result;
    }
}
