using System.Text.Json;

namespace PropertyManager.Tests;

/// <summary>
/// Shared JSON serialization options for tests.
/// </summary>
public static class TestJsonOptions
{
    /// <summary>
    /// Default serializer options (camelCase).
    /// </summary>
    public static readonly JsonSerializerOptions Default = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };
}
