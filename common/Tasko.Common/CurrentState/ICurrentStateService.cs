using System.Globalization;
using System.Security.Claims;

namespace Tasko.Common.CurrentState;

public interface ICurrentStateService
{
    // Localization
    CultureInfo Culture { get; }
    CultureInfo UiCulture { get; }
    string CultureCode { get; }        // "en", "ru", "uk", "ka"
    string UiCultureCode { get; }

    // Request identity
    string TraceId { get; }
    string? CorrelationId { get; }

    // User / Auth
    bool IsAuthenticated { get; }
    string? UserId { get; }
    string? UserName { get; }
    IReadOnlyList<string> Roles { get; }
    bool IsInRole(string role);
    Claim[] Claims { get; }

    // Network / Client
    string? IpAddress { get; }
    string? UserAgent { get; }
    string? Host { get; }
    string? Scheme { get; }
    string? Path { get; }

    // Headers (useful for debug / integrations)
    string? AcceptLanguage { get; }
    string? AuthorizationScheme { get; }
}
