using Microsoft.Extensions.DependencyInjection;
using Tasko.Common.CurrentState;

namespace Tasko.Common.Tools.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddCurrentState(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentStateService, CurrentStateService>();
        return services;
    }
}
