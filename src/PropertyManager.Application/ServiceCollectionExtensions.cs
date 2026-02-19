// PropertyManager.Application - service registration helpers
using Microsoft.Extensions.DependencyInjection;

namespace PropertyManager.Application;

/// <summary>
/// Registers application-layer services.
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds application services to the DI container.
    /// </summary>
    /// <param name="services">Service collection.</param>
    /// <returns>The same service collection for chaining.</returns>
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Reserved for application-layer registrations.
        return services;
    }
}
