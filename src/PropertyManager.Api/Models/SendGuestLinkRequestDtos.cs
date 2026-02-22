// PropertyManager.Api - request DTOs for send guest link endpoints
using System.Text.Json.Serialization;

namespace PropertyManager.Api.Models;

public sealed record SendGuestLinkEmailRequest
{
    [JsonPropertyName("propertyId")]
    public string? PropertyId { get; init; }

    [JsonPropertyName("to")]
    public string? To { get; init; }

    [JsonPropertyName("guestLink")]
    public string? GuestLink { get; init; }

    [JsonPropertyName("guestName")]
    public string? GuestName { get; init; }

    [JsonPropertyName("subject")]
    public string? Subject { get; init; }

    [JsonPropertyName("htmlBody")]
    public string? HtmlBody { get; init; }
}

public sealed record SendGuestLinkSmsRequest
{
    [JsonPropertyName("propertyId")]
    public string? PropertyId { get; init; }

    [JsonPropertyName("to")]
    public string? To { get; init; }

    [JsonPropertyName("guestLink")]
    public string? GuestLink { get; init; }

    [JsonPropertyName("message")]
    public string? Message { get; init; }
}
