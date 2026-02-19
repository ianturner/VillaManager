// PropertyManager.Application - rental unit normalization
using System.Collections.Generic;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// Helpers for normalizing single vs multi-unit rental data.
/// </summary>
public static class RentalUnitHelper
{
    /// <summary>
    /// Returns the list of rental units for a property. Uses <see cref="PropertyDto.RentalUnits"/> when present,
    /// otherwise treats <see cref="PropertyDto.Rental"/> as a single unit for backward compatibility.
    /// </summary>
    public static IReadOnlyList<RentalDto> GetRentalUnits(PropertyDto property)
    {
        if (property.RentalUnits is { Count: > 0 })
        {
            return property.RentalUnits;
        }

        if (property.Rental is not null)
        {
            return new List<RentalDto> { property.Rental };
        }

        return new List<RentalDto>();
    }
}
