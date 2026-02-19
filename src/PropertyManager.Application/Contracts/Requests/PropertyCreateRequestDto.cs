// PropertyManager.Application - DTOs
using System.Collections.Generic;
using PropertyManager.Application.Contracts.Localization;

namespace PropertyManager.Application.Contracts.Requests;

/// <summary>
/// Creates a new property shell.
/// </summary>
public sealed record PropertyCreateRequestDto
{
    /// <summary>
    /// Unique identifier (slug).
    /// </summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>
    /// Display name.
    /// </summary>
    public LocalizedString Name { get; init; } = LocalizedString.FromString(string.Empty);

    /// <summary>
    /// Status string (e.g., rental, sale).
    /// </summary>
    public string Status { get; init; } = string.Empty;

    /// <summary>
    /// Language codes this listing will support (e.g. en, fr, de, el). When null or empty, defaults to all supported.
    /// </summary>
    public List<string>? ListingLanguages { get; init; }
}
