// PropertyManager.Infrastructure - prototype data options
namespace PropertyManager.Infrastructure.Storage.Prototype;

/// <summary>
/// Configuration for prototype file-based data.
/// </summary>
public sealed class PrototypeDataOptions
{
    /// <summary>
    /// Root path for prototype data. Relative paths are resolved from content root.
    /// </summary>
    public string RootPath { get; init; } = "data";

    /// <summary>
    /// Public base path used to build asset URLs.
    /// </summary>
    public string PublicBasePath { get; init; } = "/data";
}
