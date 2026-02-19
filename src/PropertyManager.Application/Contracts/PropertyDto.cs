// PropertyManager.Application - DTOs
using System.Collections.Generic;
using PropertyManager.Application.Contracts.Localization;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents a property with all displayable content.
/// </summary>
public sealed record PropertyDto
{
    /// <summary>
    /// Unique identifier (slug).
    /// </summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>
    /// Property display name.
    /// </summary>
    public LocalizedString Name { get; init; } = LocalizedString.FromString(string.Empty);

    /// <summary>
    /// Indicates whether the property is archived.
    /// </summary>
    public bool Archived { get; init; }

    /// <summary>
    /// Status (rental or sale).
    /// </summary>
    public string Status { get; init; } = string.Empty;

    /// <summary>
    /// Version identifier for the data file.
    /// </summary>
    public string? Version { get; init; }

    /// <summary>
    /// Indicates whether the data is published.
    /// </summary>
    public bool IsPublished { get; init; }

    /// <summary>
    /// Short summary text.
    /// </summary>
    public LocalizedString? Summary { get; init; }

    /// <summary>
    /// Optional hero slideshow images.
    /// </summary>
    public List<ImageDto> HeroImages { get; init; } = new();

    /// <summary>
    /// Optional hero slideshow settings.
    /// </summary>
    public HeroSettingsDto? HeroSettings { get; init; }

    /// <summary>
    /// Property pages with flexible section layouts.
    /// </summary>
    public List<PropertyPageDto> Pages { get; init; } = new();

    /// <summary>
    /// Places page content and configuration.
    /// </summary>
    public PropertyPlacesPageDto? Places { get; init; }

    /// <summary>
    /// Optional theme configuration.
    /// </summary>
    public ThemeDto? Theme { get; init; }

    /// <summary>
    /// Selected theme name from the shared library.
    /// </summary>
    public string? ThemeName { get; init; }

    /// <summary>
    /// Optional property facts.
    /// </summary>
    public PropertyFactsDto? Facts { get; init; }

    /// <summary>
    /// Optional external booking links.
    /// </summary>
    public List<ExternalLinkDto> ExternalLinks { get; init; } = new();

    /// <summary>
    /// Location details.
    /// </summary>
    public LocationDto? Location { get; init; }

    /// <summary>
    /// Facilities list.
    /// </summary>
    public List<PropertyFacilityCategoryDto> Facilities { get; init; } = new();

    /// <summary>
    /// Associated PDFs.
    /// </summary>
    public List<PdfDto> Pdfs { get; init; } = new();

    /// <summary>
    /// Sales particulars.
    /// </summary>
    public SalesParticularsDto? SalesParticulars { get; init; }

    /// <summary>
    /// Rental details (legacy single unit). When present and <see cref="RentalUnits"/> is null or empty, treated as one unit.
    /// </summary>
    public RentalDto? Rental { get; init; }

    /// <summary>
    /// Rental units (each with own bookings, rates, conditions, ical). When null or empty, use <see cref="Rental"/> as single unit.
    /// </summary>
    public List<RentalDto>? RentalUnits { get; init; }

    /// <summary>
    /// Guest-only information (WiFi, equipment instructions, health and safety).
    /// </summary>
    public GuestInfoDto? GuestInfo { get; init; }

    /// <summary>
    /// Language codes this listing supports (e.g. en, fr, de, el). When null or empty, treat as all supported.
    /// </summary>
    public List<string>? ListingLanguages { get; init; }
}
