using Microsoft.AspNetCore.Http;
using System.Net;
using System.Text.Json;
using Tasko.Common.ErrorHandler.Exceptions;
using Tasko.Common.ErrorHandler.Models;

namespace Tasko.Common.ErrorHandler.Middleware;

public sealed class ExceptionHandlingMiddleware : IMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await WriteError(context, ex);
        }
    }

    private static async Task WriteError(HttpContext context, Exception ex)
    {
        context.Response.ContentType = "application/json";

        var (status, message, details) = ex switch
        {
            AppValidationException ave => (HttpStatusCode.BadRequest, ave.Message, new { errors = ave.Errors }),
            NotFoundException nfe      => (HttpStatusCode.NotFound,  nfe.Message, null),
            UnauthorizedException ue   => (HttpStatusCode.Unauthorized, ue.Message, null),
            ArgumentException ae       => (HttpStatusCode.BadRequest, ae.Message, null),
            _                          => (HttpStatusCode.InternalServerError, "Unexpected error", null)
        };

        context.Response.StatusCode = (int)status;

        var payload = new ErrorResponse
        {
            Message = message,
            Details = details,
            TraceId = context.TraceIdentifier
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(payload, JsonOptions));
    }
}
