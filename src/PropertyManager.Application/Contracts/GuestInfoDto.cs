// PropertyManager.Application - DTOs
using System.Collections.Generic;
using PropertyManager.Application.Contracts.Localization;

namespace PropertyManager.Application.Contracts;

/// <summary>
/// Guest-only information (WiFi, equipment instructions, health and safety).
/// </summary>
public sealed record GuestInfoDto
{
    /// <summary>
    /// WiFi network name (matches the network for the stored password).
    /// </summary>
    public string? WifiNetworkName { get; init; }

    /// <summary>
    /// Property WiFi password (plain text, guest-only).
    /// </summary>
    public string? WifiPassword { get; init; }

    /// <summary>
    /// Extra notes about the WiFi (e.g. which router, guest network).
    /// </summary>
    public LocalizedString? WifiNotes { get; init; }

    /// <summary>
    /// Equipment usage instructions (washing machine, dishwasher, coffee maker, etc.).
    /// </summary>
    public List<GuestEquipmentInstructionDto> EquipmentInstructions { get; init; } = new();

    /// <summary>
    /// Health and safety (emergency/medical/pharmacy contacts, safety advice items).
    /// </summary>
    public GuestHealthAndSafetyDto? HealthAndSafety { get; init; }
}
