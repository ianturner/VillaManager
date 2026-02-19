// PropertyManager.Application - DTOs
namespace PropertyManager.Application.Contracts.Requests;

/// <summary>
/// Creates a message thread or message.
/// </summary>
public sealed record MessageCreateRequestDto
{
    /// <summary>
    /// Property identifier.
    /// </summary>
    public string PropertyId { get; init; } = string.Empty;

    /// <summary>
    /// Recipient user identifier.
    /// </summary>
    public string ToUserId { get; init; } = string.Empty;

    /// <summary>
    /// Subject line.
    /// </summary>
    public string? Subject { get; init; }

    /// <summary>
    /// Message body.
    /// </summary>
    public string Body { get; init; } = string.Empty;
}
