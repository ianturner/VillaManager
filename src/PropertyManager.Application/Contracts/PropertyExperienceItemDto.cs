// PropertyManager.Application - DTOs
using System.Collections.Generic;
using PropertyManager.Application.Contracts.Localization;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents a single experience entry for Things To Do or Places To Go.
/// </summary>
public sealed record PropertyExperienceItemDto
{
    /// <summary>
    /// Optional category for grouping items (used for Things To Do).
    /// </summary>
    public LocalizedString? Category { get; init; }

    /// <summary>
    /// Optional heading displayed for the item.
    /// </summary>
    public LocalizedString? Heading { get; init; }

    /// <summary>
    /// Optional hero images for the item.
    /// </summary>
    public List<ImageDto> HeroImages { get; init; } = new();

    /// <summary>
    /// Main item text (supports line breaks for paragraphs).
    /// </summary>
    public LocalizedString? ItemText { get; init; }

    /// <summary>
    /// Optional gallery images for the item.
    /// </summary>
    public List<ImageDto> GalleryImages { get; init; } = new();

    /// <summary>
    /// Optional distance from the property (in kilometers).
    /// </summary>
    public double? Distance { get; init; }

    /// <summary>
    /// Optional map reference (URL or identifier).
    /// </summary>
    public string? MapReference { get; init; }

    /// <summary>
    /// Optional related links.
    /// </summary>
    public List<ExternalLinkDto> Links { get; init; } = new();
}
