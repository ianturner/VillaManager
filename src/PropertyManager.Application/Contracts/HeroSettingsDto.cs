// PropertyManager.Application - DTOs
namespace PropertyManager.Application.Contracts;

/// <summary>
/// Configures hero image slideshow behavior.
/// </summary>
public sealed record HeroSettingsDto
{
    /// <summary>
    /// Transition style for hero images.
    /// </summary>
    public string? Transition { get; init; }
}
