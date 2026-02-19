// PropertyManager.Domain - enums
namespace PropertyManager.Domain.Enums;

/// <summary>
/// Defines notification types.
/// </summary>
public enum NotificationType
{
    /// <summary>
    /// Booking request notification.
    /// </summary>
    BookingRequest = 0,

    /// <summary>
    /// New message notification.
    /// </summary>
    Message = 1,

    /// <summary>
    /// Admin action notification.
    /// </summary>
    AdminAction = 2
}
