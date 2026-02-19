// PropertyManager.Application - localization helpers
using System;
using System.Collections.Generic;
using System.Linq;

namespace PropertyManager.Application.Contracts.Localization;

/// <summary>
/// Supported language codes for localized content.
/// </summary>
public static class LanguageCodes
{
    /// <summary>
    /// Default language code.
    /// </summary>
    public const string Default = "en";

    /// <summary>
    /// Supported language codes.
    /// </summary>
    public static readonly IReadOnlyList<string> Supported = new[]
    {
        "en",
        "fr",
        "de",
        "el",
        "ar",
        "it",
        "th"
    };

    /// <summary>
    /// Normalizes a language code to a supported value.
    /// </summary>
    /// <param name="code">Raw language code.</param>
    /// <returns>Normalized supported code.</returns>
    public static string Normalize(string? code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return Default;
        }

        var normalized = code.Trim().ToLowerInvariant();
        return Supported.Contains(normalized) ? normalized : Default;
    }
}
