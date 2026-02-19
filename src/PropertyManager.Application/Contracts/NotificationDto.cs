// PropertyManager.Application - DTOs
namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents a notification item.
/// </summary>
public sealed record NotificationDto
{
    /// <summary>
    /// Notification identifier.
    /// </summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>
    /// Notification type.
    /// </summary>
    public string Type { get; init; } = string.Empty;

    /// <summary>
    /// Display title.
    /// </summary>
    public string Title { get; init; } = string.Empty;

    /// <summary>
    /// ISO 8601 timestamp.
    /// </summary>
    public string CreatedAt { get; init; } = string.Empty;

    /// <summary>
    /// Read status.
    /// </summary>
    public bool Read { get; init; }
}
