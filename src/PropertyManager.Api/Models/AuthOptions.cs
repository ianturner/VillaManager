namespace PropertyManager.Api.Models;

/// <summary>
/// Authentication configuration options.
/// </summary>
public sealed class AuthOptions
{
    /// <summary>
    /// JWT signing key.
    /// </summary>
    public string JwtKey { get; init; } = string.Empty;

    /// <summary>
    /// JWT issuer.
    /// </summary>
    public string Issuer { get; init; } = string.Empty;

    /// <summary>
    /// JWT audience.
    /// </summary>
    public string Audience { get; init; } = string.Empty;

    /// <summary>
    /// Token lifetime in minutes.
    /// </summary>
    public int TokenLifetimeMinutes { get; init; } = 120;
}
