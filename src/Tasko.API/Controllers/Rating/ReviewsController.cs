using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tasko.API.Settings;
using Tasko.Application.DTO.Rating;
using Tasko.Application.Handlers.Rating.Commands.CreateReview;
using Tasko.Application.Handlers.Rating.Queries.GetExecutorReviews;

namespace Tasko.API.Controllers.Rating
{
    [ApiController]
    [Route("api/v1/{culture}/[controller]")]
    public sealed class ReviewsController : ApiControllerBase
    {
        public ReviewsController(ISender sender) : base(sender) { }
       

        [Authorize]
        [HttpPost]
        [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<ReviewDto>> Create(
            [FromBody] CreateReviewCommand command,
            CancellationToken ct)
        {
            var result = await Sender.Send(command, ct);
            return Ok(result);
        }

        [AllowAnonymous]
        [HttpGet("executor/{executorId:long}")]
        [ProducesResponseType(typeof(IReadOnlyList<ReviewListItemDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IReadOnlyList<ReviewListItemDto>>> GetExecutorReviews(
            long executorId,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 20,
            CancellationToken ct = default)
        {
            var result = await Sender.Send(new GetExecutorReviewsQuery(executorId, skip, take), ct);
            return Ok(result);
        }
    }
}
