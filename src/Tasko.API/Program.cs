using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Localization;
using Microsoft.AspNetCore.Localization.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Globalization;
using System.Text;
using Tasko.API.Realtime;
using Tasko.Application.Abstractions.Auth;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Realtime;
using Tasko.Common.ErrorHandler.Middleware;
using Tasko.Common.Tools.Extensions;
using Tasko.Persistence.Auth;

var builder = WebApplication.CreateBuilder(args);

// -----------------------------
// Controllers (REST API)
// -----------------------------
builder.Services.AddControllers();
builder.Services.AddScoped<ITaskRealtime, SignalRTaskRealtime>();

// -----------------------------
// SignalR
// -----------------------------
builder.Services.AddSignalR();

// -----------------------------
// HttpContextAccessor (нужен для CurrentStateService)
// -----------------------------
builder.Services.AddHttpContextAccessor();

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

// даём Application доступ к DbContext через интерфейс
builder.Services.AddScoped<ITaskoDbContext>(sp => sp.GetRequiredService<TaskoDbContext>());

// -----------------------------
// JWT
// -----------------------------
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>()!;

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IPasswordHasher, Pbkdf2PasswordHasher>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
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

            NameClaimType = System.Security.Claims.ClaimTypes.Name,
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };

        // на будущее для SignalR (/hubs)
        o.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var token = ctx.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(token) && ctx.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                    ctx.Token = token;

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("SignalRCors", policy =>
    {
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .SetIsOriginAllowed(_ => true); // для dev
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

// Routing должен быть ДО route-localization
app.UseRouting();

// Localization: RouteDataRequestCultureProvider требует route values
var locOptions = app.Services.GetRequiredService<IOptions<RequestLocalizationOptions>>();
app.UseRequestLocalization(locOptions.Value);

// Global exception middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseCors("SignalRCors");

// Auth pipeline
app.UseAuthentication();
app.UseAuthorization();

// Map REST controllers
app.MapControllers();

app.MapHub<TaskHub>("/hubs/tasks");

app.Run();

