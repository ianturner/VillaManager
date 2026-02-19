// PropertyManager.Application - DTOs
using System.Collections.Generic;
using PropertyManager.Application.Contracts.Localization;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents a facility category and its items.
/// </summary>
public sealed record PropertyFacilityCategoryDto
{
    /// <summary>
    /// Category title.
    /// </summary>
    public LocalizedString Title { get; init; } = LocalizedString.FromString(string.Empty);

    /// <summary>
    /// FontAwesome icon name for the category (e.g. solid:wifi).
    /// </summary>
    public string Icon { get; init; } = string.Empty;

    /// <summary>
    /// Facility items.
    /// </summary>
    public List<PropertyFacilityItemDto> Items { get; init; } = new();
}
