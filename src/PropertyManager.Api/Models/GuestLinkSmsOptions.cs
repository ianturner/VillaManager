// PropertyManager.Api - guest link SMS service configuration
namespace PropertyManager.Api.Models;

/// <summary>
/// Parameterised configuration for the guest-link SMS service.
/// Supports Twilio (default) and can be extended for other providers.
/// </summary>
public sealed class GuestLinkSmsOptions
{
    /// <summary>
    /// Provider name: "Twilio" (default), or other supported providers.
    /// </summary>
    public string Provider { get; init; } = "Twilio";

    /// <summary>
    /// Twilio Account SID.
    /// </summary>
    public string AccountSid { get; init; } = string.Empty;

    /// <summary>
    /// Twilio Auth Token.
    /// </summary>
    public string AuthToken { get; init; } = string.Empty;

    /// <summary>
    /// API base URL. Defaults to provider-specific URL if empty.
    /// Twilio: https://api.twilio.com/2010-04-01
    /// </summary>
    public string BaseUrl { get; init; } = "https://api.twilio.com/2010-04-01";

    /// <summary>
    /// Sender phone number (E.164, e.g. +1234567890).
    /// </summary>
    public string FromNumber { get; init; } = string.Empty;
}
