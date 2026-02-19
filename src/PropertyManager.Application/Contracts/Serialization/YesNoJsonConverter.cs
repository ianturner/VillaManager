using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PropertyManager.Application.Contracts.Serialization;

/// <summary>
/// Converts boolean or Yes/No values to a normalized Yes/No string.
/// </summary>
public sealed class YesNoJsonConverter : JsonConverter<string?>
{
    /// <inheritdoc />
    public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return null;
        }

        if (reader.TokenType == JsonTokenType.True)
        {
            return "Yes";
        }

        if (reader.TokenType == JsonTokenType.False)
        {
            return "No";
        }

        if (reader.TokenType == JsonTokenType.String)
        {
            var value = reader.GetString();
            return Normalize(value);
        }

        throw new JsonException($"Unexpected token {reader.TokenType} when parsing Yes/No value.");
    }

    /// <inheritdoc />
    public override void Write(Utf8JsonWriter writer, string? value, JsonSerializerOptions options)
    {
        if (value is null)
        {
            writer.WriteNullValue();
            return;
        }

        writer.WriteStringValue(Normalize(value));
    }

    private static string? Normalize(string? value)
    {
        if (value is null)
        {
            return null;
        }

        var trimmed = value.Trim();
        if (trimmed.Length == 0)
        {
            return value;
        }

        if (string.Equals(trimmed, "true", StringComparison.OrdinalIgnoreCase))
        {
            return "Yes";
        }

        if (string.Equals(trimmed, "false", StringComparison.OrdinalIgnoreCase))
        {
            return "No";
        }

        if (string.Equals(trimmed, "yes", StringComparison.OrdinalIgnoreCase))
        {
            return "Yes";
        }

        if (string.Equals(trimmed, "no", StringComparison.OrdinalIgnoreCase))
        {
            return "No";
        }

        return value;
    }
}
