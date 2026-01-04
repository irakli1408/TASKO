using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Security.Claims;
using System.Threading.RateLimiting;

namespace Tasko.API.Realtime.Models
{
    public sealed class HubRateLimitFilter : IHubFilter
    {
        private static readonly ConcurrentDictionary<string, RateLimiter> _limiters = new();

        public async ValueTask<object?> InvokeMethodAsync(
            HubInvocationContext ctx,
            Func<HubInvocationContext, ValueTask<object?>> next)
        {
            var userId =
                ctx.Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                ctx.Context.User?.FindFirst("sub")?.Value;

            var who = !string.IsNullOrWhiteSpace(userId)
                ? $"uid:{userId}"
                : $"cid:{ctx.Context.ConnectionId}";

            // лимитируем по “кто + метод”
            var key = $"{who}:{ctx.HubMethodName}";

            var limiter = _limiters.GetOrAdd(key, _ => CreateLimiter(ctx.HubMethodName));

            using var lease = limiter.AttemptAcquire(1);
            if (!lease.IsAcquired)
                throw new HubException("Rate limit exceeded");

            return await next(ctx);
        }

        private static RateLimiter CreateLimiter(string methodName) =>
            methodName switch
            {
                // сообщения — строгий лимит
                nameof(TaskHub.SendMessage) => new SlidingWindowRateLimiter(new SlidingWindowRateLimiterOptions
                {
                    PermitLimit = 30,
                    Window = TimeSpan.FromMinutes(1),
                    SegmentsPerWindow = 6,
                    QueueLimit = 0
                }),

                // join/leave — чтобы не спамили
                nameof(TaskHub.JoinTask) or nameof(TaskHub.LeaveTask) => new FixedWindowRateLimiter(new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 60,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0
                }),

                // typing — у тебя уже есть throttle, но как страховка
                nameof(TaskHub.TypingStart) or nameof(TaskHub.TypingStop) => new FixedWindowRateLimiter(new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 180,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0
                }),

                // дефолт
                _ => new FixedWindowRateLimiter(new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 120,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0
                })
            };
    }
}
