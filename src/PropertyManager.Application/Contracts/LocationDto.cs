// PropertyManager.Application - DTOs
using PropertyManager.Application.Contracts.Localization;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents a property location.
/// </summary>
public sealed record LocationDto
{
    /// <summary>
    /// Address or locality.
    /// </summary>
    public LocalizedString Address { get; init; } = LocalizedString.FromString(string.Empty);

    /// <summary>
    /// Optional map embed URL.
    /// </summary>
    public string? MapEmbedUrl { get; init; }

    /// <summary>
    /// Additional location notes.
    /// </summary>
    public LocalizedString? Description { get; init; }
}
