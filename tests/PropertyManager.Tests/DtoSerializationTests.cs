using System.Text.Json;
using PropertyManager.Application.Contracts;
using PropertyManager.Application.Contracts.Localization;
using PropertyManager.Application.Contracts.Responses;
using Xunit;

namespace PropertyManager.Tests;

/// <summary>
/// Validates basic JSON serialization behavior for DTOs.
/// </summary>
public class DtoSerializationTests
{
    [Fact]
    public void PropertyDto_SerializesWithExpectedKeys()
    {
        var dto = new PropertyDto
        {
            Id = "villa_janoula",
            Name = LocalizedString.FromString("Villa Janoula"),
            Status = "rental",
            Version = "20260125130000",
            IsPublished = true,
            Facilities = new()
            {
                new PropertyFacilityCategoryDto
                {
                    Title = LocalizedString.FromString("General"),
                    Icon = "solid:wifi",
                    Items = new()
                    {
                        new PropertyFacilityItemDto { Text = LocalizedString.FromString("Wi-Fi") }
                    }
                }
            }
        };

        var json = JsonSerializer.Serialize(dto, TestJsonOptions.Default);

        Assert.Contains("\"id\":\"villa_janoula\"", json, StringComparison.Ordinal);
        Assert.Contains("\"name\":\"Villa Janoula\"", json, StringComparison.Ordinal);
        Assert.Contains("\"status\":\"rental\"", json, StringComparison.Ordinal);
        Assert.Contains("\"version\":\"20260125130000\"", json, StringComparison.Ordinal);
        Assert.Contains("\"isPublished\":true", json, StringComparison.Ordinal);
        Assert.Contains("\"facilities\":[", json, StringComparison.Ordinal);
    }

    [Fact]
    public void PoiDto_SerializesWithExpectedKeys()
    {
        var dto = new PoiDto
        {
            Id = "restaurant_x",
            Name = "Restaurant X",
            Category = "Restaurant"
        };

        var json = JsonSerializer.Serialize(dto, TestJsonOptions.Default);

        Assert.Contains("\"id\":\"restaurant_x\"", json, StringComparison.Ordinal);
        Assert.Contains("\"name\":\"Restaurant X\"", json, StringComparison.Ordinal);
        Assert.Contains("\"category\":\"Restaurant\"", json, StringComparison.Ordinal);
    }

    [Fact]
    public void UploadResponseDto_SerializesUploadedItems()
    {
        var dto = new UploadResponseDto
        {
            Uploaded = new()
            {
                new UploadItemDto { Src = "https://cdn.example.com/image.jpg" }
            }
        };

        var json = JsonSerializer.Serialize(dto, TestJsonOptions.Default);

        Assert.Contains("\"uploaded\":[", json, StringComparison.Ordinal);
        Assert.Contains("\"src\":\"https://cdn.example.com/image.jpg\"", json, StringComparison.Ordinal);
    }

    [Fact]
    public void MessageDto_SerializesWithExpectedKeys()
    {
        var dto = new MessageDto
        {
            Id = "m_1",
            ThreadId = "t_1",
            PropertyId = "villa_janoula",
            FromUserId = "u_1",
            ToUserId = "u_2",
            Subject = "Booking request",
            Body = "Hello",
            SentAt = "2026-01-20T10:00:00Z"
        };

        var json = JsonSerializer.Serialize(dto, TestJsonOptions.Default);

        Assert.Contains("\"id\":\"m_1\"", json, StringComparison.Ordinal);
        Assert.Contains("\"threadId\":\"t_1\"", json, StringComparison.Ordinal);
        Assert.Contains("\"propertyId\":\"villa_janoula\"", json, StringComparison.Ordinal);
        Assert.Contains("\"fromUserId\":\"u_1\"", json, StringComparison.Ordinal);
        Assert.Contains("\"toUserId\":\"u_2\"", json, StringComparison.Ordinal);
        Assert.Contains("\"subject\":\"Booking request\"", json, StringComparison.Ordinal);
        Assert.Contains("\"body\":\"Hello\"", json, StringComparison.Ordinal);
        Assert.Contains("\"sentAt\":\"2026-01-20T10:00:00Z\"", json, StringComparison.Ordinal);
    }

    [Fact]
    public void FinanceEntryDto_SerializesWithExpectedKeys()
    {
        var dto = new FinanceEntryDto
        {
            Id = "fe_1",
            PropertyId = "villa_janoula",
            Type = "cost",
            Amount = 120.5m,
            Currency = "EUR",
            Date = "2026-01-10",
            Description = "Plumbing repair"
        };

        var json = JsonSerializer.Serialize(dto, TestJsonOptions.Default);

        Assert.Contains("\"id\":\"fe_1\"", json, StringComparison.Ordinal);
        Assert.Contains("\"propertyId\":\"villa_janoula\"", json, StringComparison.Ordinal);
        Assert.Contains("\"type\":\"cost\"", json, StringComparison.Ordinal);
        Assert.Contains("\"amount\":120.5", json, StringComparison.Ordinal);
        Assert.Contains("\"currency\":\"EUR\"", json, StringComparison.Ordinal);
        Assert.Contains("\"date\":\"2026-01-10\"", json, StringComparison.Ordinal);
        Assert.Contains("\"description\":\"Plumbing repair\"", json, StringComparison.Ordinal);
    }

    [Fact]
    public void NotificationDto_SerializesWithExpectedKeys()
    {
        var dto = new NotificationDto
        {
            Id = "n_1",
            Type = "booking_request",
            Title = "New booking request",
            CreatedAt = "2026-01-20T10:01:00Z",
            Read = false
        };

        var json = JsonSerializer.Serialize(dto, TestJsonOptions.Default);

        Assert.Contains("\"id\":\"n_1\"", json, StringComparison.Ordinal);
        Assert.Contains("\"type\":\"booking_request\"", json, StringComparison.Ordinal);
        Assert.Contains("\"title\":\"New booking request\"", json, StringComparison.Ordinal);
        Assert.Contains("\"createdAt\":\"2026-01-20T10:01:00Z\"", json, StringComparison.Ordinal);
        Assert.Contains("\"read\":false", json, StringComparison.Ordinal);
    }

    [Fact]
    public void RentalDto_SerializesWithExpectedKeys()
    {
        var dto = new RentalDto
        {
            Availability = new()
            {
                new RentalAvailabilityDto
                {
                    Year = 2026,
                    CalendarImage = new ImageDto { Src = "https://cdn.example.com/2026.png", Alt = LocalizedString.FromString("Availability 2026") }
                }
            },
            Bookings = new()
            {
                new RentalBookingDto
                {
                    From = "07/02/2026",
                    To = "28/02/2026",
                    Names = "Andrew Badger",
                    Source = "Relative"
                }
            },
            Rates = new()
            {
                new RentalRateDto { Season = "High", PricePerWeek = "1200" }
            },
            Conditions = new() { "No smoking" }
        };

        var json = JsonSerializer.Serialize(dto, TestJsonOptions.Default);

        Assert.Contains("\"availability\":[", json, StringComparison.Ordinal);
        Assert.Contains("\"year\":2026", json, StringComparison.Ordinal);
        Assert.Contains("\"calendarImage\":", json, StringComparison.Ordinal);
        Assert.Contains("\"src\":\"https://cdn.example.com/2026.png\"", json, StringComparison.Ordinal);
        Assert.Contains("\"alt\":\"Availability 2026\"", json, StringComparison.Ordinal);
        Assert.Contains("\"bookings\":[", json, StringComparison.Ordinal);
        Assert.Contains("\"from\":\"07/02/2026\"", json, StringComparison.Ordinal);
        Assert.Contains("\"to\":\"28/02/2026\"", json, StringComparison.Ordinal);
        Assert.Contains("\"names\":\"Andrew Badger\"", json, StringComparison.Ordinal);
        Assert.Contains("\"source\":\"Relative\"", json, StringComparison.Ordinal);
        Assert.Contains("\"rates\":[", json, StringComparison.Ordinal);
        Assert.Contains("\"season\":\"High\"", json, StringComparison.Ordinal);
        Assert.Contains("\"pricePerWeek\":\"1200\"", json, StringComparison.Ordinal);
        Assert.Contains("\"conditions\":[\"No smoking\"]", json, StringComparison.Ordinal);
    }
}
