// PropertyManager.Application - DTOs
using System.Collections.Generic;
using System.Text.Json.Serialization;
using PropertyManager.Application.Contracts.Localization;
using PropertyManager.Application.Contracts.Serialization;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents a property page with flexible sections.
/// </summary>
public sealed record PropertyPageDto
{
    /// <summary>
    /// Page identifier (slug) used for routing.
    /// </summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>
    /// Page title.
    /// </summary>
    public LocalizedString Title { get; init; } = LocalizedString.FromString(string.Empty);

    /// <summary>
    /// Whether to render a sections submenu for this page.
    /// </summary>
    [JsonConverter(typeof(YesNoJsonConverter))]
    public string? ShowSectionsSubmenu { get; init; }

    /// <summary>
    /// Optional hero slideshow images.
    /// </summary>
    public List<ImageDto> HeroImages { get; init; } = new();

    /// <summary>
    /// Optional hero text.
    /// </summary>
    public LocalizedString? HeroText { get; init; }

    /// <summary>
    /// Page sections.
    /// </summary>
    public List<PropertySectionDto> Sections { get; init; } = new();
}
