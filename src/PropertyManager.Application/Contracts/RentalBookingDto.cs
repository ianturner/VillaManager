// PropertyManager.Application - DTOs
using System.Text.Json.Serialization;
using PropertyManager.Application.Contracts.Serialization;
namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents a booking entry for a rental property.
/// </summary>
public sealed record RentalBookingDto
{
    /// <summary>
    /// Start date (as provided, e.g. dd/MM/yyyy).
    /// </summary>
    public string? From { get; init; }

    /// <summary>
    /// End date (as provided, e.g. dd/MM/yyyy).
    /// </summary>
    public string? To { get; init; }

    /// <summary>
    /// Number of nights.
    /// </summary>
    public string? Nights { get; init; }

    /// <summary>
    /// Guest name(s).
    /// </summary>
    public string? Names { get; init; }

    /// <summary>
    /// Booking source (e.g. AirBnb, Vrbo).
    /// </summary>
    public string? Source { get; init; }

    /// <summary>
    /// Date of booking.
    /// </summary>
    public string? DateOfBooking { get; init; }

    /// <summary>
    /// Booking identifier used for guest access links.
    /// </summary>
    public string? BookingId { get; init; }

    /// <summary>
    /// Repeat visit indicator.
    /// </summary>
    public string? RepeatVisit { get; init; }

    /// <summary>
    /// Preferred language for the guest (BCP-47 code).
    /// </summary>
    public string? PreferredLanguage { get; init; }

    /// <summary>
    /// Indicates whether the guest has arrived.
    /// </summary>
    [JsonConverter(typeof(YesNoJsonConverter))]
    public string? HasArrived { get; init; }

    /// <summary>
    /// Indicates whether the guest is a VIP.
    /// </summary>
    [JsonPropertyName("vipGuest")]
    [JsonConverter(typeof(YesNoJsonConverter))]
    public string? VipGuest { get; init; }

    /// <summary>
    /// Cleaning date.
    /// </summary>
    public string? CleanDate { get; init; }

    /// <summary>
    /// Identification type.
    /// </summary>
    public string? IdentificationType { get; init; }

    /// <summary>
    /// Identification number.
    /// </summary>
    public string? IdentificationNumber { get; init; }

    /// <summary>
    /// Arrival airport.
    /// </summary>
    public string? Airport { get; init; }

    /// <summary>
    /// Flight number.
    /// </summary>
    public string? FlightNumber { get; init; }

    /// <summary>
    /// Arrival time.
    /// </summary>
    public string? ArrivalTime { get; init; }

    /// <summary>
    /// Departure time.
    /// </summary>
    public string? DepartureTime { get; init; }

    /// <summary>
    /// Number of adults.
    /// </summary>
    public string? Adults { get; init; }

    /// <summary>
    /// Number of children.
    /// </summary>
    public string? Children { get; init; }

    /// <summary>
    /// Ages of children.
    /// </summary>
    public string? ChildrenAges { get; init; }

    /// <summary>
    /// Cot required indicator.
    /// </summary>
    public string? CotRequired { get; init; }

    /// <summary>
    /// Income in euros.
    /// </summary>
    public string? IncomeEur { get; init; }

    /// <summary>
    /// EUR to GBP exchange rate used.
    /// </summary>
    public string? ExchangeRateEurGbp { get; init; }

    /// <summary>
    /// Euros per night.
    /// </summary>
    public string? EurPerNight { get; init; }

    /// <summary>
    /// Income in GBP.
    /// </summary>
    public string? IncomeGbp { get; init; }

    /// <summary>
    /// GBP per night.
    /// </summary>
    public string? GbpPerNight { get; init; }

    /// <summary>
    /// Date registered with AADE.
    /// </summary>
    public string? DateRegisteredWithAade { get; init; }

    /// <summary>
    /// AADE screenshot reference.
    /// </summary>
    public string? AadeScreenshot { get; init; }

    /// <summary>
    /// Additional comments.
    /// </summary>
    public string? Comments { get; init; }
}
