// PropertyManager.Application - DTOs
using System.Collections.Generic;
using PropertyManager.Application.Contracts.Localization;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// A single emergency, medical or pharmacy contact for guests.
/// Category is one of: "Emergency Services", "Medical Centres", "Pharmacies".
/// Medical centres and pharmacies can include a photo (text wrap), map reference and links.
/// </summary>
public sealed record GuestEmergencyContactDto
{
    /// <summary>
    /// Category: "Emergency Services", "Medical Centres", or "Pharmacies".
    /// </summary>
    public string Category { get; init; } = string.Empty;

    /// <summary>
    /// Display name (e.g. "Local police", "24h Pharmacy").
    /// </summary>
    public LocalizedString? Name { get; init; }

    /// <summary>
    /// Phone number.
    /// </summary>
    public string? Phone { get; init; }

    /// <summary>
    /// Optional notes (address, opening hours, etc.).
    /// </summary>
    public LocalizedString? Notes { get; init; }

    /// <summary>
    /// Optional photos (e.g. for medical centres/pharmacies). First image can wrap with text; multiple supported.
    /// </summary>
    public List<ImageDto> Images { get; init; } = new();

    /// <summary>
    /// Optional map URL (e.g. Google Maps link).
    /// </summary>
    public string? MapReference { get; init; }

    /// <summary>
    /// Optional links (website, Facebook, TripAdvisor, etc.).
    /// </summary>
    public List<ExternalLinkDto> Links { get; init; } = new();

    /// <summary>
    /// Optional distance from the property (e.g. in kilometres). Used to sort so closest appears first.
    /// </summary>
    public double? Distance { get; init; }
}
