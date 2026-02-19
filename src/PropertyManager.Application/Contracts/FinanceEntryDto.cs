// PropertyManager.Application - DTOs
using System.Collections.Generic;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents a finance entry (cost or income).
/// </summary>
public sealed record FinanceEntryDto
{
    /// <summary>
    /// Entry identifier.
    /// </summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>
    /// Property identifier.
    /// </summary>
    public string PropertyId { get; init; } = string.Empty;

    /// <summary>
    /// Entry type (cost or income).
    /// </summary>
    public string Type { get; init; } = string.Empty;

    /// <summary>
    /// Amount value.
    /// </summary>
    public decimal Amount { get; init; }

    /// <summary>
    /// Currency code (e.g., EUR).
    /// </summary>
    public string Currency { get; init; } = string.Empty;

    /// <summary>
    /// ISO 8601 date string.
    /// </summary>
    public string Date { get; init; } = string.Empty;

    /// <summary>
    /// Description text.
    /// </summary>
    public string? Description { get; init; }

    /// <summary>
    /// Receipt images.
    /// </summary>
    public List<ImageDto> Receipts { get; init; } = new();
}
