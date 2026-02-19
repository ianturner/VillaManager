// PropertyManager.Application - DTOs
using PropertyManager.Application.Contracts.Localization;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents an external booking link.
/// </summary>
public sealed record ExternalLinkDto
{
    /// <summary>
    /// External URL.
    /// </summary>
    public string Url { get; init; } = string.Empty;

    /// <summary>
    /// Optional label for the link.
    /// </summary>
    public LocalizedString? Label { get; init; }
}
