// PropertyManager.Application - DTOs
using System;
using PropertyManager.Application.Contracts.Localization;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents a facility item (description only; category icon is on the group).
/// </summary>
public sealed record PropertyFacilityItemDto
{
    /// <summary>
    /// Facility description.
    /// </summary>
    public LocalizedString Text { get; init; } = LocalizedString.FromString(string.Empty);
}
