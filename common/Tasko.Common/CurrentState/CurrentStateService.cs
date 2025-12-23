using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace Tasko.Common.CurrentState;

public sealed class CurrentStateService : ICurrentStateService
{
    private readonly IHttpContextAccessor _http;

    public CurrentStateService(IHttpContextAccessor http)
    {
        _http = http;
    }

    private HttpContext? Ctx => _http.HttpContext;

    // ----------------------
    // Localization
    // ----------------------
    public CultureInfo Culture => Ctx?.Features.Get<Microsoft.AspNetCore.Localization.IRequestCultureFeature>()?.RequestCulture.Culture
                                  ?? CultureInfo.CurrentCulture;

    public CultureInfo UiCulture => Ctx?.Features.Get<Microsoft.AspNetCore.Localization.IRequestCultureFeature>()?.RequestCulture.UICulture
                                    ?? CultureInfo.CurrentUICulture;

    public string CultureCode => Culture.TwoLetterISOLanguageName;     // en/ru/uk/ka
    public string UiCultureCode => UiCulture.TwoLetterISOLanguageName;

    // ----------------------
    // Request identity
    // ----------------------
    public string TraceId => Ctx?.TraceIdentifier ?? Guid.NewGuid().ToString("N");

    // Common pattern: X-Correlation-Id header (optional)
    public string? CorrelationId => GetHeader("X-Correlation-Id");

    // ----------------------
    // User / Auth
    // ----------------------
    public bool IsAuthenticated => Ctx?.User?.Identity?.IsAuthenticated ?? false;

    public string? UserId =>
        Ctx?.User?.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? Ctx?.User?.FindFirstValue("sub");

    public string? UserName =>
        Ctx?.User?.Identity?.Name
        ?? Ctx?.User?.FindFirstValue(ClaimTypes.Name)
        ?? Ctx?.User?.FindFirstValue("name");

    public IReadOnlyList<string> Roles =>
        (Ctx?.User?.FindAll(ClaimTypes.Role).Select(x => x.Value).Distinct().ToList()
        ?? new List<string>())
        .AsReadOnly();

    public bool IsInRole(string role) => Ctx?.User?.IsInRole(role) ?? false;

    public Claim[] Claims => Ctx?.User?.Claims?.ToArray() ?? Array.Empty<Claim>();

    // ----------------------
    // Network / Client
    // ----------------------
    public string? IpAddress
    {
        get
        {
            // If you run behind reverse proxy later, you may want ForwardedHeaders middleware.
            var ip = Ctx?.Connection?.RemoteIpAddress?.ToString();
            return string.IsNullOrWhiteSpace(ip) ? null : ip;
        }
    }

    public string? UserAgent => GetHeader("User-Agent");

    public string? Host => Ctx?.Request?.Host.Value;
    public string? Scheme => Ctx?.Request?.Scheme;
    public string? Path => Ctx?.Request?.Path.Value;

    // ----------------------
    // Headers
    // ----------------------
    public string? AcceptLanguage => GetHeader("Accept-Language");

    public string? AuthorizationScheme
    {
        get
        {
            var auth = GetHeader("Authorization");
            if (string.IsNullOrWhiteSpace(auth)) return null;
            // "Bearer xxx"
            var parts = auth.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            return parts.Length > 0 ? parts[0] : null;
        }
    }

    private string? GetHeader(string key)
    {
        if (Ctx?.Request?.Headers is null) return null;
        if (!Ctx.Request.Headers.TryGetValue(key, out var values)) return null;
        var value = values.ToString();
        return string.IsNullOrWhiteSpace(value) ? null : value;
    }
}
