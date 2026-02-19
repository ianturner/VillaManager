// PropertyManager.Infrastructure - service registration helpers
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PropertyManager.Application.Services.Repositories;
using PropertyManager.Infrastructure.Storage.Prototype;

namespace PropertyManager.Infrastructure;

/// <summary>
/// Registers infrastructure-layer services.
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds infrastructure services to the DI container.
    /// </summary>
    /// <param name="services">Service collection.</param>
    /// <param name="configuration">Application configuration.</param>
    /// <returns>The same service collection for chaining.</returns>
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<PrototypeDataOptions>(configuration.GetSection("PrototypeData"));
        services.Configure<UserStoreOptions>(configuration.GetSection("UserStore"));
        services.Configure<ThemeStoreOptions>(configuration.GetSection("ThemeStore"));
        services.AddSingleton<IPropertyRepository, JsonFilePropertyRepository>();
        services.AddSingleton<IPoiRepository, JsonFilePoiRepository>();
        services.AddSingleton<IMessagingRepository, PrototypeMessagingRepository>();
        services.AddSingleton<INotificationRepository, PrototypeNotificationRepository>();
        services.AddSingleton<IFinanceRepository, PrototypeFinanceRepository>();
        services.AddSingleton<IUserRepository, JsonFileUserRepository>();
        services.AddSingleton<IThemeRepository, JsonFileThemeRepository>();

        return services;
    }
}
