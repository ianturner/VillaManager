// PropertyManager.Application - DTOs
using System.Collections.Generic;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents a stored user with authentication credentials.
/// </summary>
public sealed record UserCredentialDto
{
    /// <summary>
    /// Unique identifier.
    /// </summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>
    /// Login username.
    /// </summary>
    public string Username { get; init; } = string.Empty;

    /// <summary>
    /// Friendly display name.
    /// </summary>
    public string DisplayName { get; init; } = string.Empty;

    /// <summary>
    /// User roles.
    /// </summary>
    public List<string> Roles { get; init; } = new();

    /// <summary>
    /// Property identifiers assigned to the user.
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
    /// Indicates whether the account is disabled.
    /// </summary>
    public bool Disabled { get; init; }

    /// <summary>
    /// Preferred language code for UI.
    /// </summary>
    public string? PreferredLanguage { get; init; }

    /// <summary>
    /// PBKDF2 password hash (Base64).
    /// </summary>
    public string PasswordHash { get; init; } = string.Empty;

    /// <summary>
    /// PBKDF2 password salt (Base64).
    /// </summary>
    public string PasswordSalt { get; init; } = string.Empty;
}
