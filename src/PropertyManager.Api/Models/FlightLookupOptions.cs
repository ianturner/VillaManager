// PropertyManager.Api - flight lookup options
namespace PropertyManager.Api.Models;

/// <summary>
/// Configuration for flight schedule lookup.
/// </summary>
public sealed class FlightLookupOptions
{
    /// <summary>
    /// Provider API base URL.
    /// </summary>
    public string BaseUrl { get; init; } = "https://prod.api.market/api/v1/aedbx/aerodatabox";

    /// <summary>
    /// Provider API key.
    /// </summary>
    public string ApiKey { get; init; } = string.Empty;

    /// <summary>
    /// Header name for the API key.
    /// </summary>
    public string ApiKeyHeader { get; init; } = "x-api-market-key";
}
