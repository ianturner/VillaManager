// PropertyManager.Application - DTOs
using PropertyManager.Application.Contracts.Localization;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents a downloadable PDF asset.
/// </summary>
public sealed record PdfDto
{
    /// <summary>
    /// Unique identifier (slug).
    /// </summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>
    /// Display title.
    /// </summary>
    public LocalizedString Title { get; init; } = LocalizedString.FromString(string.Empty);

    /// <summary>
    /// Type/category (e.g., directions, poi).
    /// </summary>
    public string Type { get; init; } = string.Empty;

    /// <summary>
    /// PDF URL.
    /// </summary>
    public string Src { get; init; } = string.Empty;
}
