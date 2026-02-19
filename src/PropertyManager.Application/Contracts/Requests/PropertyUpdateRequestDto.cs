// PropertyManager.Application - DTOs
using System.Collections.Generic;
using PropertyManager.Application.Contracts;
using PropertyManager.Application.Contracts.Localization;

namespace PropertyManager.Application.Contracts.Requests;

/// <summary>
/// Updates property content fields.
/// </summary>
public sealed record PropertyUpdateRequestDto
{
    /// <summary>
    /// Optional display name.
    /// </summary>
    public LocalizedString? Name { get; init; }

    /// <summary>
    /// Optional status string.
    /// </summary>
    public string? Status { get; init; }

    /// <summary>
    /// Optional archived flag.
    /// </summary>
    public bool? Archived { get; init; }

    /// <summary>
    /// Optional summary text.
    /// </summary>
    public LocalizedString? Summary { get; init; }

    /// <summary>
    /// Optional hero slideshow images.
    /// </summary>
    public List<ImageDto>? HeroImages { get; init; }

    /// <summary>
    /// Optional hero slideshow settings.
    /// </summary>
    public HeroSettingsDto? HeroSettings { get; init; }

    /// <summary>
    /// Optional property pages with flexible section layouts.
    /// </summary>
    public List<PropertyPageDto>? Pages { get; init; }

    /// <summary>
    /// Optional places page content and configuration.
    /// </summary>
    public PropertyPlacesPageDto? Places { get; init; }

    /// <summary>
    /// Optional theme configuration.
    /// </summary>
    public ThemeDto? Theme { get; init; }

    /// <summary>
    /// Optional selected theme name.
    /// </summary>
    public string? ThemeName { get; init; }

    /// <summary>
    /// Optional property facts.
    /// </summary>
    public PropertyFactsDto? Facts { get; init; }

    /// <summary>
    /// Optional external booking links.
    /// </summary>
    public List<ExternalLinkDto>? ExternalLinks { get; init; }

    /// <summary>
    /// Optional location details.
    /// </summary>
    public LocationDto? Location { get; init; }

    /// <summary>
    /// Optional facilities list.
    /// </summary>
    public List<PropertyFacilityCategoryDto>? Facilities { get; init; }

    /// <summary>
    /// Optional PDFs.
    /// </summary>
    public List<PdfDto>? Pdfs { get; init; }

    /// <summary>
    /// Optional sales particulars.
    /// </summary>
    public SalesParticularsDto? SalesParticulars { get; init; }

    /// <summary>
    /// Optional rental details (legacy single unit). Ignored if <see cref="RentalUnits"/> is provided.
    /// </summary>
    public RentalDto? Rental { get; init; }

    /// <summary>
    /// Optional rental units (each with own bookings, rates, conditions, ical). When provided, replaces all units.
    /// </summary>
    public List<RentalDto>? RentalUnits { get; init; }

    /// <summary>
    /// Optional guest-only information.
    /// </summary>
    public GuestInfoDto? GuestInfo { get; init; }

    /// <summary>
    /// Optional language codes this listing supports (e.g. en, fr, de, el).
    /// </summary>
    public List<string>? ListingLanguages { get; init; }
}
