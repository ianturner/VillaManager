namespace PropertyManager.Api.Models;

/// <summary>
/// Authentication login request payload.
/// </summary>
public sealed record AuthLoginRequest
{
    /// <summary>
    /// Username.
    /// </summary>
    public string Username { get; init; } = string.Empty;

    /// <summary>
    /// Password.
    /// </summary>
    public string Password { get; init; } = string.Empty;
}
