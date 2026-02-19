// PropertyManager.Application - DTOs
namespace PropertyManager.Application.Contracts.Requests;

/// <summary>
/// Creates a finance entry for a property.
/// </summary>
public sealed record FinanceEntryCreateRequestDto
{
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
}
