using System.Collections.Generic;

namespace PropertyManager.Api.Models;

/// <summary>
/// Authenticated user summary.
/// </summary>
public sealed record AuthUserInfo
{
    /// <summary>
    /// User identifier.
    /// </summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>
    /// Username.
    /// </summary>
    public string Username { get; init; } = string.Empty;

    /// <summary>
    /// Display name.
    /// </summary>
    public string DisplayName { get; init; } = string.Empty;

    /// <summary>
    /// User roles.
    /// </summary>
    public List<string> Roles { get; init; } = new();

    /// <summary>
    /// Assigned property identifiers.
    /// </summary>
    public List<string> PropertyIds { get; init; } = new();

    /// <summary>
    /// Preferred language code.
    /// </summary>
    public string? PreferredLanguage { get; init; }
}
