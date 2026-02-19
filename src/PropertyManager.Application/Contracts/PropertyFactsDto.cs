// PropertyManager.Application - DTOs
namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents key property facts.
/// </summary>
public sealed record PropertyFactsDto
{
    /// <summary>
    /// Number of bedrooms.
    /// </summary>
    public decimal? Bedrooms { get; init; }

    /// <summary>
    /// Number of bathrooms.
    /// </summary>
    public decimal? Bathrooms { get; init; }

    /// <summary>
    /// Number of kitchens.
    /// </summary>
    public decimal? Kitchens { get; init; }

    /// <summary>
    /// Interior area in square meters.
    /// </summary>
    public decimal? InteriorAreaSqm { get; init; }

    /// <summary>
    /// Land area in square meters.
    /// </summary>
    public decimal? LandAreaSqm { get; init; }
}
