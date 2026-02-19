// PropertyManager.Application - DTOs
namespace PropertyManager.Application.Contracts.Requests;

/// <summary>
/// Creates a new POI.
/// </summary>
public sealed record PoiCreateRequestDto
{
    /// <summary>
    /// Unique identifier (slug).
    /// </summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>
    /// Display name.
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// Category (e.g., Restaurant).
    /// </summary>
    public string? Category { get; init; }

    /// <summary>
    /// Description text.
    /// </summary>
    public string? Description { get; init; }

    /// <summary>
    /// Distance from property.
    /// </summary>
    public string? Distance { get; init; }

    /// <summary>
    /// Map link.
    /// </summary>
    public string? MapLink { get; init; }
}
