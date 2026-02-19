using System;
using PropertyManager.Application.Services;
using PropertyManager.Domain.Enums;
using Xunit;

namespace PropertyManager.Tests;

/// <summary>
/// Tests for enum mapping helpers.
/// </summary>
public class EnumMappingsTests
{
    [Theory]
    [InlineData("rental", PropertyStatus.Rental)]
    [InlineData("sale", PropertyStatus.Sale)]
    public void ToPropertyStatus_ParsesKnownValues(string input, PropertyStatus expected)
    {
        var result = EnumMappings.ToPropertyStatus(input);

        Assert.Equal(expected, result);
    }

    [Fact]
    public void ToPropertyStatus_ThrowsOnUnknownValue()
    {
        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            EnumMappings.ToPropertyStatus("unknown"));

        Assert.Contains("Unknown property status", exception.Message, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData(PropertyStatus.Rental, "rental")]
    [InlineData(PropertyStatus.Sale, "sale")]
    public void ToPropertyStatusString_ReturnsExpectedString(PropertyStatus status, string expected)
    {
        var result = EnumMappings.ToPropertyStatusString(status);

        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("cost", FinanceEntryType.Cost)]
    [InlineData("income", FinanceEntryType.Income)]
    public void ToFinanceEntryType_ParsesKnownValues(string input, FinanceEntryType expected)
    {
        var result = EnumMappings.ToFinanceEntryType(input);

        Assert.Equal(expected, result);
    }

    [Fact]
    public void ToFinanceEntryType_ThrowsOnUnknownValue()
    {
        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            EnumMappings.ToFinanceEntryType("other"));

        Assert.Contains("Unknown finance entry type", exception.Message, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData(FinanceEntryType.Cost, "cost")]
    [InlineData(FinanceEntryType.Income, "income")]
    public void ToFinanceEntryTypeString_ReturnsExpectedString(FinanceEntryType entryType, string expected)
    {
        var result = EnumMappings.ToFinanceEntryTypeString(entryType);

        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("directions", PdfType.Directions)]
    [InlineData("poi", PdfType.Poi)]
    [InlineData("other", PdfType.Other)]
    public void ToPdfType_ParsesKnownValues(string input, PdfType expected)
    {
        var result = EnumMappings.ToPdfType(input);

        Assert.Equal(expected, result);
    }

    [Fact]
    public void ToPdfType_ThrowsOnUnknownValue()
    {
        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            EnumMappings.ToPdfType("guide"));

        Assert.Contains("Unknown PDF type", exception.Message, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData(PdfType.Directions, "directions")]
    [InlineData(PdfType.Poi, "poi")]
    [InlineData(PdfType.Other, "other")]
    public void ToPdfTypeString_ReturnsExpectedString(PdfType pdfType, string expected)
    {
        var result = EnumMappings.ToPdfTypeString(pdfType);

        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("booking_request", NotificationType.BookingRequest)]
    [InlineData("message", NotificationType.Message)]
    [InlineData("admin_action", NotificationType.AdminAction)]
    public void ToNotificationType_ParsesKnownValues(string input, NotificationType expected)
    {
        var result = EnumMappings.ToNotificationType(input);

        Assert.Equal(expected, result);
    }

    [Fact]
    public void ToNotificationType_ThrowsOnUnknownValue()
    {
        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            EnumMappings.ToNotificationType("unknown"));

        Assert.Contains("Unknown notification type", exception.Message, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData(NotificationType.BookingRequest, "booking_request")]
    [InlineData(NotificationType.Message, "message")]
    [InlineData(NotificationType.AdminAction, "admin_action")]
    public void ToNotificationTypeString_ReturnsExpectedString(NotificationType notificationType, string expected)
    {
        var result = EnumMappings.ToNotificationTypeString(notificationType);

        Assert.Equal(expected, result);
    }
}
