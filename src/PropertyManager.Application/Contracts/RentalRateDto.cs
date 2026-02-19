// PropertyManager.Application - DTOs
namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents rental rates for a season.
/// </summary>
public sealed record RentalRateDto
{
    /// <summary>
    /// Season name.
    /// </summary>
    public string Season { get; init; } = string.Empty;

    /// <summary>
    /// Price per week text.
    /// </summary>
    public string? PricePerWeek { get; init; }
}
