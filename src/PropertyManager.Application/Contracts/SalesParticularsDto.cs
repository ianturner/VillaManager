// PropertyManager.Application - DTOs
using System.Collections.Generic;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents sales particulars for a property.
/// </summary>
public sealed record SalesParticularsDto
{
    /// <summary>
    /// Price text.
    /// </summary>
    public string? Price { get; init; }

    /// <summary>
    /// Legal notes.
    /// </summary>
    public string? Legal { get; init; }

    /// <summary>
    /// Document references or URLs.
    /// </summary>
    public List<string> Documents { get; init; } = new();
}
