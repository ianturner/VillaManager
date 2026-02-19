// PropertyManager.Application - DTOs
using PropertyManager.Application.Contracts.Localization;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// A single safety advice item: topic (heading) and notes (body text).
/// </summary>
public sealed record GuestSafetyAdviceItemDto
{
    /// <summary>
    /// Topic heading (e.g. "Pool safety", "Stairs").
    /// </summary>
    public LocalizedString? Topic { get; init; }

    /// <summary>
    /// Body text under the topic heading.
    /// </summary>
    public LocalizedString? Notes { get; init; }
}
