// PropertyManager.Application - DTOs
using PropertyManager.Application.Contracts.Localization;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents a configurable sub-section of the Places page.
/// </summary>
public sealed record PropertyPlacesSectionDto
{
    /// <summary>
    /// Stable identifier for the section.
    /// </summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>
    /// Section title shown in navigation.
    /// </summary>
    public LocalizedString Title { get; init; } = LocalizedString.FromString(string.Empty);

    /// <summary>
    /// Optional description shown under the section heading.
    /// </summary>
    public LocalizedString? Description { get; init; }

    /// <summary>
    /// Optional FontAwesome icon identifier (e.g., "solid:utensils").
    /// </summary>
    public string? Icon { get; init; }

    /// <summary>
    /// Optional hex color used for category tags (e.g., "#4f46e5").
    /// </summary>
    public string? Color { get; init; }

    /// <summary>
    /// Category value used to filter matching items.
    /// </summary>
    public string CategoryValue { get; init; } = string.Empty;
}
