// PropertyManager.Application - enum mapping helpers
using System;
using PropertyManager.Domain.Enums;

namespace PropertyManager.Application.Services;

/// <summary>
/// Converts between DTO string values and domain enums.
/// </summary>
public static class EnumMappings
{
    /// <summary>
    /// Converts a property status string to a domain enum.
    /// </summary>
    public static PropertyStatus ToPropertyStatus(string value)
    {
        return value.Trim().ToLowerInvariant() switch
        {
            "rental" => PropertyStatus.Rental,
            "sale" => PropertyStatus.Sale,
            _ => throw new ArgumentOutOfRangeException(nameof(value), value, "Unknown property status.")
        };
    }

    /// <summary>
    /// Converts a domain property status to a DTO string.
    /// </summary>
    public static string ToPropertyStatusString(PropertyStatus status)
    {
        return status switch
        {
            PropertyStatus.Rental => "rental",
            PropertyStatus.Sale => "sale",
            _ => throw new ArgumentOutOfRangeException(nameof(status), status, "Unknown property status.")
        };
    }

    /// <summary>
    /// Converts a finance entry type string to a domain enum.
    /// </summary>
    public static FinanceEntryType ToFinanceEntryType(string value)
    {
        return value.Trim().ToLowerInvariant() switch
        {
            "cost" => FinanceEntryType.Cost,
            "income" => FinanceEntryType.Income,
            _ => throw new ArgumentOutOfRangeException(nameof(value), value, "Unknown finance entry type.")
        };
    }

    /// <summary>
    /// Converts a domain finance entry type to a DTO string.
    /// </summary>
    public static string ToFinanceEntryTypeString(FinanceEntryType entryType)
    {
        return entryType switch
        {
            FinanceEntryType.Cost => "cost",
            FinanceEntryType.Income => "income",
            _ => throw new ArgumentOutOfRangeException(nameof(entryType), entryType, "Unknown finance entry type.")
        };
    }

    /// <summary>
    /// Converts a PDF type string to a domain enum.
    /// </summary>
    public static PdfType ToPdfType(string value)
    {
        return value.Trim().ToLowerInvariant() switch
        {
            "directions" => PdfType.Directions,
            "poi" => PdfType.Poi,
            "other" => PdfType.Other,
            _ => throw new ArgumentOutOfRangeException(nameof(value), value, "Unknown PDF type.")
        };
    }

    /// <summary>
    /// Converts a domain PDF type to a DTO string.
    /// </summary>
    public static string ToPdfTypeString(PdfType pdfType)
    {
        return pdfType switch
        {
            PdfType.Directions => "directions",
            PdfType.Poi => "poi",
            PdfType.Other => "other",
            _ => throw new ArgumentOutOfRangeException(nameof(pdfType), pdfType, "Unknown PDF type.")
        };
    }

    /// <summary>
    /// Converts a notification type string to a domain enum.
    /// </summary>
    public static NotificationType ToNotificationType(string value)
    {
        return value.Trim().ToLowerInvariant() switch
        {
            "booking_request" => NotificationType.BookingRequest,
            "message" => NotificationType.Message,
            "admin_action" => NotificationType.AdminAction,
            _ => throw new ArgumentOutOfRangeException(nameof(value), value, "Unknown notification type.")
        };
    }

    /// <summary>
    /// Converts a domain notification type to a DTO string.
    /// </summary>
    public static string ToNotificationTypeString(NotificationType notificationType)
    {
        return notificationType switch
        {
            NotificationType.BookingRequest => "booking_request",
            NotificationType.Message => "message",
            NotificationType.AdminAction => "admin_action",
            _ => throw new ArgumentOutOfRangeException(nameof(notificationType), notificationType, "Unknown notification type.")
        };
    }
}
