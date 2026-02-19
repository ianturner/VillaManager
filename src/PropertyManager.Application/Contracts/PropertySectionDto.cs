// PropertyManager.Application - DTOs
using System.Collections.Generic;
using PropertyManager.Application.Contracts.Localization;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents a property section (e.g., room or exterior area).
/// </summary>
public sealed record PropertySectionDto
{
    /// <summary>
    /// Section identifier (slug) used for navigation.
    /// </summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>
    /// Section title.
    /// </summary>
    public LocalizedString? Title { get; init; }

    /// <summary>
    /// Section description.
    /// </summary>
    public LocalizedString? Description { get; init; }

    /// <summary>
    /// Section hero text.
    /// </summary>
    public LocalizedString? HeroText { get; init; }

    /// <summary>
    /// Section hero images.
    /// </summary>
    public List<ImageDto> HeroImages { get; init; } = new();

    /// <summary>
    /// Section images.
    /// </summary>
    public List<ImageDto> Images { get; init; } = new();
}
