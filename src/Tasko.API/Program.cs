using Asp.Versioning;
using Asp.Versioning.Routing;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Localization;
using Microsoft.AspNetCore.Localization.Routing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Globalization;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using Tasko.API.Common.Model;
using Tasko.API.Realtime;
using Tasko.API.Realtime.Models;
using Tasko.API.Services.Media;
using Tasko.Application.Abstractions.Auth;
using Tasko.Application.Abstractions.Email;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Realtime;
using Tasko.Application.Abstractions.Services;
using Tasko.Application.Media;
using Tasko.Application.Services;
using Tasko.Application.Settings;
using Tasko.Common.ErrorHandler.Middleware;
using Tasko.Common.Tools.Extensions;
using Tasko.Persistence.Auth;
using Tasko.Persistence.Email;

var builder = WebApplication.CreateBuilder(args);

// -----------------------------
// Controllers (REST API)
// -----------------------------
builder.Services.AddControllers();

// ✅ Mute-flow presence (должен быть Singleton)
builder.Services.AddSingleton<IChatPresence, InMemoryChatPresence>();

builder.Services.AddScoped<ITaskRealtime, SignalRTaskRealtime>();
builder.Services.AddScoped<IChatRealtime, SignalRChatRealtime>();

builder.Services.AddScoped<ITaskViewService, TaskViewService>();

builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<INotificationRealtime, SignalRNotificationRealtime>();

// -----------------------------
// Media (local wwwroot/uploads)
// -----------------------------
builder.Services.AddScoped<IFileStorage, LocalFileStorage>();
builder.Services.AddScoped<IMediaService, MediaService>();

// Media options (formats/limits)
builder.Services.Configure<MediaOptions>(builder.Configuration.GetSection("Media"));

// -----------------------------
// HttpContextAccessor (нужен для CurrentStateService)
// -----------------------------
builder.Services.AddHttpContextAccessor();

builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection("Email"));
builder.Services.Configure<PasswordResetOptions>(builder.Configuration.GetSection("PasswordReset"));

builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
builder.Services.AddScoped<IPasswordResetTokenService, PasswordResetTokenService>();


// -----------------------------
// SignalR + Hub filters
// -----------------------------
builder.Services.AddSignalR(o =>
{
    o.AddFilter<HubRateLimitFilter>();
});

builder.Services.AddApiVersioning(o =>
{
    o.DefaultApiVersion = new ApiVersion(1, 0);
    o.AssumeDefaultVersionWhenUnspecified = true;
    o.ReportApiVersions = true;

    // URL segment: /api/v{version}/...
    o.ApiVersionReader = new UrlSegmentApiVersionReader();
})
.AddApiExplorer(o =>
{
    o.GroupNameFormat = "'v'VVV";
    o.SubstituteApiVersionInUrl = true;
});

// 💯 фикс твоей ошибки "apiVersion could not be resolved"
builder.Services.Configure<RouteOptions>(o =>
{
    o.ConstraintMap["apiVersion"] = typeof(ApiVersionRouteConstraint);
});

// -----------------------------
// Rate Limiter (HTTP)
// -----------------------------
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync(
            """{"error":"rate_limit","message":"Too many requests. Try again later."}""",
            token);
    };

    // AUTH (login/refresh) — по IP жестче
    options.AddPolicy("auth", ctx =>
    {
        var ip = GetUserOrIpKey.GetClientIp(ctx);
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: $"ip:{ip}",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
    });

    // READ (feed/get) — мягче
    options.AddPolicy("read", ctx =>
    {
        var key = GetUserOrIpKey.UserOrIpKey(ctx);
        return RateLimitPartition.GetTokenBucketLimiter(
            partitionKey: $"read:{key}",
            factory: _ => new TokenBucketRateLimiterOptions
            {
                TokenLimit = 120,
                TokensPerPeriod = 120,
                ReplenishmentPeriod = TimeSpan.FromMinutes(1),
                AutoReplenishment = true,
                QueueLimit = 0
            });
    });

    // WRITE (offers/messages/assign/status change) — умеренно
    options.AddPolicy("write", ctx =>
    {
        var key = GetUserOrIpKey.UserOrIpKey(ctx);
        return RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: $"write:{key}",
            factory: _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 6,
                QueueLimit = 0
            });
    });

    // UPLOAD — отдельно (дороже)
    options.AddPolicy("upload", ctx =>
    {
        var key = GetUserOrIpKey.UserOrIpKey(ctx);
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: $"upload:{key}",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
    });

    // HUB negotiate/handshake (HTTP часть)
    options.AddPolicy("hub", ctx =>
    {
        var key = GetUserOrIpKey.UserOrIpKey(ctx);
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: $"hub:{key}",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
    });
});

// -----------------------------
// OutputCache (HTTP caching)
// -----------------------------
builder.Services.AddOutputCache(options =>
{
    // Публичные справочники (категории)
    options.AddPolicy("PublicCategories5m", p =>
        p.Expire(TimeSpan.FromMinutes(5))
         .Tag("categories"));

    // Публичный профиль мастера
    options.AddPolicy("PublicProfile1m", p =>
        p.Expire(TimeSpan.FromMinutes(1))
         .Tag("profiles"));

    // Feed мастера: зависит от query + user (через header)
    options.AddPolicy("Feed10s", p =>
        p.Expire(TimeSpan.FromSeconds(10))
         .SetVaryByQuery(new[] { "*" })
         .SetVaryByHeader("X-Cache-User")
         .Tag("feed"));

    // Карточка таска: зависит от taskId + user (через header)
    // ⚠️ если в контроллере route не taskId, а id — поменяй "taskId" -> "id"
    options.AddPolicy("TaskById5s", p =>
        p.Expire(TimeSpan.FromSeconds(5))
         .SetVaryByRouteValue(new[] { "taskId" })
         .SetVaryByHeader("X-Cache-User")
         .Tag("tasks"));

    // Список изображений таска (быстро отдавать)
    // ⚠️ аналогично: проверь имя route параметра
    options.AddPolicy("TaskImages30s", p =>
        p.Expire(TimeSpan.FromSeconds(30))
         .SetVaryByRouteValue(new[] { "taskId" })
         .Tag("images"));
});

// -----------------------------
// MediatR (Handlers из Tasko.Application)
// -----------------------------
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(Tasko.Application.DTO.Auth.AuthResultDto).Assembly));

// -----------------------------
// Swagger + JWT Bearer
// -----------------------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Tasko API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Введите: Bearer {JWT токен}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// -----------------------------
// Global error handling
// -----------------------------
builder.Services.AddTransient<ExceptionHandlingMiddleware>();

// -----------------------------
// CurrentState (culture, user, ip, headers, trace, etc.)
// -----------------------------
builder.Services.AddCurrentState();

// -----------------------------
// Localization
// -----------------------------
builder.Services.AddLocalization();

var supportedCultures = new[] { "en", "ka", "uk", "ru" }
    .Select(c => new CultureInfo(c))
    .ToList();

builder.Services.Configure<RequestLocalizationOptions>(options =>
{
    options.DefaultRequestCulture = new RequestCulture("en");
    options.SupportedCultures = supportedCultures;
    options.SupportedUICultures = supportedCultures;

    options.RequestCultureProviders = new List<IRequestCultureProvider>
    {
        new RouteDataRequestCultureProvider
        {
            RouteDataStringKey = "culture",
            UIRouteDataStringKey = "culture"
        },
        new AcceptLanguageHeaderRequestCultureProvider()
    };
});

// -----------------------------
// DB
// -----------------------------
builder.Services.AddDbContext<TaskoDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("TaskoDBConnection")));

builder.Services.AddScoped<ITaskoDbContext>(sp => sp.GetRequiredService<TaskoDbContext>());

// -----------------------------
// JWT
// -----------------------------
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>()!;

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IPasswordHasher, Pbkdf2PasswordHasher>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new()
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,

            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            ClockSkew = TimeSpan.FromSeconds(10),

            NameClaimType = ClaimTypes.Name,
            RoleClaimType = ClaimTypes.Role
        };

        // ✅ токен для SignalR приходит через query string "access_token"
        o.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var accessToken = ctx.Request.Query["access_token"];
                var path = ctx.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) &&
                    (path.StartsWithSegments("/hubs/tasks") ||
                     path.StartsWithSegments("/hubs/notifications")))
                {
                    ctx.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// -----------------------------
// CORS for SignalR (dev)
// -----------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("SignalRCors", policy =>
    {
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .SetIsOriginAllowed(_ => true);
    });
});

var app = builder.Build();

// -----------------------------
// Swagger UI
// -----------------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();

app.UseStaticFiles();

var locOptions = app.Services.GetRequiredService<IOptions<RequestLocalizationOptions>>();
app.UseRequestLocalization(locOptions.Value);

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseCors("SignalRCors");

// ✅ Auth ДО RateLimiter/OutputCache (чтобы key был по userId)
app.UseAuthentication();
app.UseAuthorization();

// ✅ RateLimiter ДО OutputCache (чтобы кэш не обходил лимиты)
app.UseRateLimiter();

// ✅ Подготовка заголовка для OutputCache vary-by-user (замена SetVaryByValue)
app.Use(async (ctx, next) =>
{
    var uid = ctx.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
              ?? ctx.User?.FindFirst("sub")?.Value
              ?? "anon";

    ctx.Request.Headers["X-Cache-User"] = uid;

    await next();
});

app.UseOutputCache();

// Map REST controllers
app.MapControllers();

// Map SignalR hubs (HTTP handshake/negotiate лимитируем политикой "hub")
app.MapHub<TaskHub>("/hubs/tasks").RequireRateLimiting("hub");
app.MapHub<NotificationsHub>("/hubs/notifications").RequireRateLimiting("hub");

app.Run();
