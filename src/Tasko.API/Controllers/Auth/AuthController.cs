using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Tasko.API.Settings;
using Tasko.Application.DTO.Auth;
using Tasko.Application.Handlers.Auth.Commands.Login;
using Tasko.Application.Handlers.Auth.Commands.Logout;
using Tasko.Application.Handlers.Auth.Commands.Refresh;
using Tasko.Application.Handlers.Auth.Commands.Register;
using Tasko.Application.Handlers.Auth.Queries.Me;

namespace Tasko.API.Controllers.Auth
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [EnableRateLimiting("auth")]
    public sealed class AuthController : ApiControllerBase
    {
        public AuthController(ISender sender) : base(sender) { }

        /// <summary>
        /// Register new user (Customer by default)
        /// </summary>
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResultDto>> Register(
            [FromBody] RegisterCommand command,
            CancellationToken cancellationToken)
        {
            var result = await Sender.Send(command, cancellationToken);
            return Ok(result);
        }

        /// <summary>
        /// Login by email + password
        /// </summary>
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResultDto>> Login(
            [FromBody] LoginCommand command,
            CancellationToken cancellationToken)
        {
            var result = await Sender.Send(command, cancellationToken);
            return Ok(result);
        }

        /// <summary>
        /// Refresh access token by refresh token (rotation)
        /// </summary>
        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResultDto>> Refresh(
            [FromBody] RefreshTokenCommand command,
            CancellationToken cancellationToken)
        {
            var result = await Sender.Send(command, cancellationToken);
            return Ok(result);
        }

        /// <summary>
        /// Logout (revoke refresh token or all sessions - depends on implementation)
        /// </summary>
        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout(
            [FromBody] LogoutCommand command,
            CancellationToken cancellationToken)
        {
            await Sender.Send(command, cancellationToken);
            return NoContent();
        }

        /// <summary>
        /// Current user info (for testing JWT)
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        [DisableRateLimiting]
        public async Task<ActionResult<UserDto>> Me(CancellationToken cancellationToken)
        {
            var result = await Sender.Send(new MeQuery(), cancellationToken);
            return Ok(result);
        }
    }
}
