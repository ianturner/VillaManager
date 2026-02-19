// PropertyManager.Infrastructure - theme store options
namespace PropertyManager.Infrastructure.Storage.Prototype;

/// <summary>
/// Configuration for the theme store.
/// </summary>
public sealed record ThemeStoreOptions
{
    /// <summary>
    /// Path to the themes file (relative to prototype root).
    /// </summary>
    public string ThemesFile { get; init; } = "themes.json";
}
