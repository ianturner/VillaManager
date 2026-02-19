// PropertyManager.Application - localized string converter
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PropertyManager.Application.Contracts.Localization;

/// <summary>
/// Handles JSON serialization for <see cref="LocalizedString"/>.
/// </summary>
public sealed class LocalizedStringJsonConverter : JsonConverter<LocalizedString>
{
    /// <inheritdoc />
    public override LocalizedString? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return null;
        }

        if (reader.TokenType == JsonTokenType.String)
        {
            var value = reader.GetString();
            return value is null ? null : LocalizedString.FromString(value);
        }

        if (reader.TokenType == JsonTokenType.StartObject)
        {
            var translations = JsonSerializer.Deserialize<Dictionary<string, string>>(ref reader, options)
                ?? new Dictionary<string, string>();
            return LocalizedString.FromTranslations(translations);
        }

        throw new JsonException("Unsupported LocalizedString JSON token.");
    }

    /// <inheritdoc />
    public override void Write(Utf8JsonWriter writer, LocalizedString value, JsonSerializerOptions options)
    {
        if (value is null)
        {
            writer.WriteNullValue();
            return;
        }

        if (value.Translations.Count > 0)
        {
            JsonSerializer.Serialize(writer, value.Translations, options);
            return;
        }

        writer.WriteStringValue(value.Value ?? string.Empty);
    }
}
