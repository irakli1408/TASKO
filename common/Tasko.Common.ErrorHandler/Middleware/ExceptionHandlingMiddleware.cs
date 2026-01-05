using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Text.Json;
using Tasko.Common.ErrorHandler.Exceptions;
using Tasko.Common.ErrorHandler.Models;

namespace Tasko.Common.ErrorHandler.Middleware;

public sealed class ExceptionHandlingMiddleware : IMiddleware
{
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public ExceptionHandlingMiddleware(ILogger<ExceptionHandlingMiddleware> logger)
    {
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            // если ответ уже начали писать — нельзя менять headers/status/body
            if (context.Response.HasStarted)
                throw;

            await WriteError(context, ex);
        }
    }

    private async Task WriteError(HttpContext context, Exception ex)
    {
        context.Response.ContentType = "application/json";

        var (status, message, details) = ex switch
        {
            AppValidationException ave => (HttpStatusCode.BadRequest, ave.Message, new { errors = ave.Errors }),

            NotFoundException nfe => (HttpStatusCode.NotFound, nfe.Message, null),
            KeyNotFoundException knf => (HttpStatusCode.NotFound, knf.Message, null),

            UnauthorizedException ue => (HttpStatusCode.Unauthorized, ue.Message, null),
            UnauthorizedAccessException uae => (HttpStatusCode.Unauthorized, uae.Message, null),

            // если добавишь ForbiddenException — просто раскомментируй:
            // ForbiddenException fe         => (HttpStatusCode.Forbidden, fe.Message, null),

            ArgumentException ae => (HttpStatusCode.BadRequest, ae.Message, null),
            InvalidOperationException ioe => (HttpStatusCode.BadRequest, ioe.Message, null),

            _ => (HttpStatusCode.InternalServerError, "Unexpected error", null)
        };

        context.Response.StatusCode = (int)status;

        var payload = new ErrorResponse
        {
            Message = message,
            Details = details,
            TraceId = context.TraceIdentifier
        };

        // ✅ логируем ВСЕ 500 как Error, остальное как Warning
        if (status == HttpStatusCode.InternalServerError)
        {
            _logger.LogError(ex,
                "Unhandled exception. TraceId={TraceId} Path={Path}",
                context.TraceIdentifier,
                context.Request.Path);
        }
        else
        {
            _logger.LogWarning(ex,
                "Handled exception ({Status}). TraceId={TraceId} Path={Path} Message={Message}",
                (int)status,
                context.TraceIdentifier,
                context.Request.Path,
                message);
        }

        await context.Response.WriteAsync(JsonSerializer.Serialize(payload, JsonOptions));
    }
}
