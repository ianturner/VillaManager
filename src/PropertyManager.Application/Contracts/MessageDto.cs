// PropertyManager.Application - DTOs
using System.Collections.Generic;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents a message within a thread.
/// </summary>
public sealed record MessageDto
{
    /// <summary>
    /// Message identifier.
    /// </summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>
    /// Thread identifier.
    /// </summary>
    public string ThreadId { get; init; } = string.Empty;

    /// <summary>
    /// Property identifier.
    /// </summary>
    public string PropertyId { get; init; } = string.Empty;

    /// <summary>
    /// Sender user identifier.
    /// </summary>
    public string FromUserId { get; init; } = string.Empty;

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

    /// <summary>
    /// ISO 8601 timestamp.
    /// </summary>
    public string SentAt { get; init; } = string.Empty;
}

/// <summary>
/// Represents a message thread with messages.
/// </summary>
public sealed record MessageThreadDto
{
    /// <summary>
    /// Thread identifier.
    /// </summary>
    public string ThreadId { get; init; } = string.Empty;

    /// <summary>
    /// Thread messages.
    /// </summary>
    public List<MessageDto> Messages { get; init; } = new();
}
