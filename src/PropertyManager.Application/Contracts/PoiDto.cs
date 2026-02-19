// PropertyManager.Application - DTOs
using System.Collections.Generic;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents a point of interest.
/// </summary>
public sealed record PoiDto
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

    /// <summary>
    /// Images for the POI.
    /// </summary>
    public List<ImageDto> Images { get; init; } = new();

    /// <summary>
    /// PDFs for the POI.
    /// </summary>
    public List<PdfDto> Pdfs { get; init; } = new();
}
