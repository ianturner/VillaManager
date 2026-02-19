// PropertyManager.Application - DTOs
using System.Collections.Generic;

namespace PropertyManager.Application.Contracts.Responses;

/// <summary>
/// Represents upload results.
/// </summary>
public sealed record UploadResponseDto
{
    /// <summary>
    /// Uploaded items.
    /// </summary>
    public List<UploadItemDto> Uploaded { get; init; } = new();
}

/// <summary>
/// Represents a single uploaded asset.
/// </summary>
public sealed record UploadItemDto
{
    /// <summary>
    /// Asset URL.
    /// </summary>
    public string Src { get; init; } = string.Empty;
}
