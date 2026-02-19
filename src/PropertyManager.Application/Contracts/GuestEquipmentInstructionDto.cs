// PropertyManager.Application - DTOs
using PropertyManager.Application.Contracts.Localization;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// Equipment usage instruction for guests (e.g. washing machine, dishwasher, coffee maker).
/// </summary>
public sealed record GuestEquipmentInstructionDto
{
    /// <summary>
    /// Unique identifier (slug).
    /// </summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>
    /// Display name (e.g. "Washing machine").
    /// </summary>
    public LocalizedString Name { get; init; } = LocalizedString.FromString(string.Empty);

    /// <summary>
    /// In-page usage instructions (rich text).
    /// </summary>
    public LocalizedString? Instructions { get; init; }

    /// <summary>
    /// Optional PDF id from property PDFs, or PDF filename for download.
    /// </summary>
    public string? PdfId { get; init; }
}
