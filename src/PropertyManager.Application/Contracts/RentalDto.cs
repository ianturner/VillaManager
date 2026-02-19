// PropertyManager.Application - DTOs
using System.Collections.Generic;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents rental details for a single rental unit (one property can have multiple units).
/// </summary>
public sealed record RentalDto
{
    /// <summary>
    /// Optional display name for this unit (e.g. "Studio", "Apartment A"). Used when property has multiple units.
    /// </summary>
    public string? Name { get; init; }

    /// <summary>
    /// Optional stable id for this unit (e.g. for external listing correlation). Used when property has multiple units.
    /// </summary>
    public string? Id { get; init; }

    /// <summary>
    /// Availability entries by year.
    /// </summary>
    public List<RentalAvailabilityDto> Availability { get; init; } = new();

    /// <summary>
    /// Booking entries.
    /// </summary>
    public List<RentalBookingDto> Bookings { get; init; } = new();

    /// <summary>
    /// Optional iCal feed URL for live availability.
    /// </summary>
    public string? IcalUrl { get; init; }

    /// <summary>
    /// Seasonal rates.
    /// </summary>
    public List<RentalRateDto> Rates { get; init; } = new();

    /// <summary>
    /// Rental conditions.
    /// </summary>
    public List<string> Conditions { get; init; } = new();
}
