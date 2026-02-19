// PropertyManager.Application - DTOs
namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents rental availability for a year.
/// </summary>
public sealed record RentalAvailabilityDto
{
    /// <summary>
    /// Calendar year.
    /// </summary>
    public int Year { get; init; }

    /// <summary>
    /// Calendar image.
    /// </summary>
    public ImageDto? CalendarImage { get; init; }
}
