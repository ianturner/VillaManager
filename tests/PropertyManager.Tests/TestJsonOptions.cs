using System.Text.Json;
using PropertyManager.Application.Contracts.Localization;

namespace PropertyManager.Tests;

/// <summary>
/// Shared JSON serialization options for tests.
/// </summary>
public static class TestJsonOptions
{
    /// <summary>
    /// Default serializer options (camelCase, with LocalizedString support).
    /// </summary>
    public static readonly JsonSerializerOptions Default = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new LocalizedStringJsonConverter() }
    };
}
