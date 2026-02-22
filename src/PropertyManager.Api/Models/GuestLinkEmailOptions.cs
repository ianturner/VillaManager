// PropertyManager.Api - guest link email service configuration
namespace PropertyManager.Api.Models;

/// <summary>
/// Parameterised configuration for the guest-link email service.
/// Supports Resend (default) and can be extended for other providers.
/// </summary>
public sealed class GuestLinkEmailOptions
{
    /// <summary>
    /// Provider name: "Resend" (default), or other supported providers.
    /// </summary>
    public string Provider { get; init; } = "Resend";

    /// <summary>
    /// API key for the provider (e.g. Resend API key).
    /// </summary>
    public string ApiKey { get; init; } = string.Empty;

    /// <summary>
    /// API base URL. Defaults to provider-specific URL if empty.
    /// Resend: https://api.resend.com
    /// </summary>
    public string BaseUrl { get; init; } = "https://api.resend.com";

    /// <summary>
    /// Sender email address (must be verified with provider).
    /// </summary>
    public string FromEmail { get; init; } = string.Empty;

    /// <summary>
    /// Sender display name (optional).
    /// </summary>
    public string FromName { get; init; } = string.Empty;
}
