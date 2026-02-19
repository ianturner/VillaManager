using System;

namespace PropertyManager.Api.Models;

/// <summary>
/// Authentication login response payload.
/// </summary>
public sealed record AuthLoginResponse
{
    /// <summary>
    /// JWT access token.
    /// </summary>
    public string Token { get; init; } = string.Empty;

    /// <summary>
    /// Token expiry (UTC).
    /// </summary>
    public DateTimeOffset ExpiresAt { get; init; }

    /// <summary>
    /// Authenticated user info.
    /// </summary>
    public AuthUserInfo User { get; init; } = new();
}
