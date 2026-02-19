using System.Collections.Generic;

namespace PropertyManager.Api.Models;

/// <summary>
/// User summary for administration screens.
/// </summary>
public sealed record UserManagementDto
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
    /// Roles.
    /// </summary>
    public List<string> Roles { get; init; } = new();

    /// <summary>
    /// Assigned properties.
    /// </summary>
    public List<string> PropertyIds { get; init; } = new();

    /// <summary>
    /// Email address.
    /// </summary>
    public string? Email { get; init; }

    /// <summary>
    /// Phone number.
    /// </summary>
    public string? Phone { get; init; }

    /// <summary>
    /// WhatsApp contact.
    /// </summary>
    public string? WhatsApp { get; init; }

    /// <summary>
    /// Viber contact.
    /// </summary>
    public string? Viber { get; init; }

    /// <summary>
    /// Whether the account is disabled.
    /// </summary>
    public bool Disabled { get; init; }

    /// <summary>
    /// Preferred language code.
    /// </summary>
    public string? PreferredLanguage { get; init; }
}

/// <summary>
/// Create request for a user.
/// </summary>
public sealed record UserCreateRequest
{
    /// <summary>
    /// Username.
    /// </summary>
    public string Username { get; init; } = string.Empty;

    /// <summary>
    /// Display name.
    /// </summary>
    public string DisplayName { get; init; } = string.Empty;

    /// <summary>
    /// Roles.
    /// </summary>
    public List<string> Roles { get; init; } = new();

    /// <summary>
    /// Assigned property ids.
    /// </summary>
    public List<string> PropertyIds { get; init; } = new();

    /// <summary>
    /// Email address.
    /// </summary>
    public string? Email { get; init; }

    /// <summary>
    /// Phone number.
    /// </summary>
    public string? Phone { get; init; }

    /// <summary>
    /// WhatsApp contact.
    /// </summary>
    public string? WhatsApp { get; init; }

    /// <summary>
    /// Viber contact.
    /// </summary>
    public string? Viber { get; init; }

    /// <summary>
    /// Password.
    /// </summary>
    public string Password { get; init; } = string.Empty;

    /// <summary>
    /// Whether the account is disabled.
    /// </summary>
    public bool Disabled { get; init; }

    /// <summary>
    /// Preferred language code.
    /// </summary>
    public string? PreferredLanguage { get; init; }
}

/// <summary>
/// Update request for a user.
/// </summary>
public sealed record UserUpdateRequest
{
    /// <summary>
    /// Username.
    /// </summary>
    public string? Username { get; init; }

    /// <summary>
    /// Display name.
    /// </summary>
    public string? DisplayName { get; init; }

    /// <summary>
    /// Roles.
    /// </summary>
    public List<string>? Roles { get; init; }

    /// <summary>
    /// Assigned property ids.
    /// </summary>
    public List<string>? PropertyIds { get; init; }

    /// <summary>
    /// Email address.
    /// </summary>
    public string? Email { get; init; }

    /// <summary>
    /// Phone number.
    /// </summary>
    public string? Phone { get; init; }

    /// <summary>
    /// WhatsApp contact.
    /// </summary>
    public string? WhatsApp { get; init; }

    /// <summary>
    /// Viber contact.
    /// </summary>
    public string? Viber { get; init; }

    /// <summary>
    /// Password (optional).
    /// </summary>
    public string? Password { get; init; }

    /// <summary>
    /// Whether the account is disabled.
    /// </summary>
    public bool? Disabled { get; init; }

    /// <summary>
    /// Preferred language code.
    /// </summary>
    public string? PreferredLanguage { get; init; }
}

/// <summary>
/// Property summary for user access assignment.
/// </summary>
public sealed record PropertySummaryDto
{
    /// <summary>
    /// Property identifier.
    /// </summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>
    /// Property name.
    /// </summary>
    public string Name { get; init; } = string.Empty;
}
