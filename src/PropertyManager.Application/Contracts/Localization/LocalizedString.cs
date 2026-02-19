// PropertyManager.Application - localized string model
using System;
using System.Collections.Generic;
using System.Linq;

namespace PropertyManager.Application.Contracts.Localization;

/// <summary>
/// Represents a string that can be translated into multiple languages.
/// </summary>
public sealed record LocalizedString
{
    /// <summary>
    /// Single value (used when no translations are provided).
    /// </summary>
    public string? Value { get; init; }

    /// <summary>
    /// Translations keyed by language code.
    /// </summary>
    public Dictionary<string, string> Translations { get; init; } = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Resolves a value for a specific language.
    /// </summary>
    /// <param name="languageCode">Requested language code.</param>
    /// <param name="fallbackLanguage">Fallback language code.</param>
    /// <returns>Resolved string.</returns>
    public string Resolve(string languageCode, string fallbackLanguage = LanguageCodes.Default)
    {
        if (Translations.Count == 0)
        {
            return Value ?? string.Empty;
        }

        var normalized = LanguageCodes.Normalize(languageCode);
        if (Translations.TryGetValue(normalized, out var match))
        {
            return match;
        }

        if (Translations.TryGetValue(fallbackLanguage, out var fallback))
        {
            return fallback;
        }

        return Translations.Values.FirstOrDefault() ?? Value ?? string.Empty;
    }

    /// <summary>
    /// Creates a localized string from a single value.
    /// </summary>
    /// <param name="value">String value.</param>
    /// <returns>Localized string instance.</returns>
    public static LocalizedString FromString(string value) => new() { Value = value };

    /// <summary>
    /// Creates a localized string from translations.
    /// </summary>
    /// <param name="translations">Translations dictionary.</param>
    /// <returns>Localized string instance.</returns>
    public static LocalizedString FromTranslations(IDictionary<string, string> translations)
        => new() { Translations = new Dictionary<string, string>(translations, StringComparer.OrdinalIgnoreCase) };
}
