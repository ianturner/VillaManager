// PropertyManager.Application - DTOs
using System.Collections.Generic;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// Health and safety information for guests: emergency/medical/pharmacy contacts and safety advice items.
/// </summary>
public sealed record GuestHealthAndSafetyDto
{
    /// <summary>
    /// Emergency services, medical centres and pharmacies (category, name, phone, notes).
    /// </summary>
    public List<GuestEmergencyContactDto> EmergencyContacts { get; init; } = new();

    /// <summary>
    /// Safety advice items: each has a topic (heading) and notes (body text).
    /// </summary>
    public List<GuestSafetyAdviceItemDto> SafetyAdviceItems { get; init; } = new();
}
