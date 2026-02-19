// PropertyManager.Application - DTOs
using PropertyManager.Application.Contracts.Localization;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents an image asset.
/// </summary>
public sealed record ImageDto
{
    /// <summary>
    /// Image URL.
    /// </summary>
    public string Src { get; set; } = string.Empty;

    /// <summary>
    /// Accessible description.
    /// </summary>
    public LocalizedString? Alt { get; init; }
}
