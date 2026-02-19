namespace PropertyManager.Api.Models;

/// <summary>
/// Represents a blocked date range from an iCal feed.
/// </summary>
public sealed record IcalAvailabilityRangeDto
{
    /// <summary>
    /// Inclusive start date (YYYY-MM-DD).
    /// </summary>
    public string Start { get; init; } = string.Empty;

    /// <summary>
    /// Inclusive end date (YYYY-MM-DD).
    /// </summary>
    public string End { get; init; } = string.Empty;

    /// <summary>
    /// Optional event summary.
    /// </summary>
    public string? Summary { get; init; }
}
