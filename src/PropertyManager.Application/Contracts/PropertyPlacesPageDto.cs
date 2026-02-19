// PropertyManager.Application - DTOs
using System.Collections.Generic;
using PropertyManager.Application.Contracts.Localization;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents the Places page content and configuration.
/// </summary>
public sealed record PropertyPlacesPageDto
{
    /// <summary>
    /// Page title shown in navigation and page header.
    /// </summary>
    public LocalizedString PageTitle { get; init; } = LocalizedString.FromString(string.Empty);

    /// <summary>
    /// Optional description shown under the page title.
    /// </summary>
    public LocalizedString? Description { get; init; }

    /// <summary>
    /// Configured sub-sections for grouping items.
    /// </summary>
    public List<PropertyPlacesSectionDto> Sections { get; init; } = new();

    /// <summary>
    /// Items displayed on the Places page.
    /// </summary>
    public List<PropertyExperienceItemDto> Items { get; init; } = new();
}
