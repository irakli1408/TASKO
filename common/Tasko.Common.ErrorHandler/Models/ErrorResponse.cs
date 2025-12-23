namespace Tasko.Common.ErrorHandler.Models;

public sealed class ErrorResponse
{
    public string Message { get; init; } = "Error";
    public string? TraceId { get; init; }
    public object? Details { get; init; }
}
