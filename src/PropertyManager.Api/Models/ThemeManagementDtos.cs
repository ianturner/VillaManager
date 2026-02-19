using PropertyManager.Application.Contracts;

namespace PropertyManager.Api.Models;

/// <summary>
/// Theme create request.
/// </summary>
public sealed record ThemeCreateRequest
{
    /// <summary>
    /// Theme identifier.
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// Display name for the theme.
    /// </summary>
    public string DisplayName { get; init; } = string.Empty;

    /// <summary>
    /// Whether the theme is private.
    /// </summary>
    public bool IsPrivate { get; init; }

    /// <summary>
    /// Default mode.
    /// </summary>
    public string? DefaultMode { get; init; }

    /// <summary>
    /// Light palette.
    /// </summary>
    public ThemePaletteDto Light { get; init; } = new();

    /// <summary>
    /// Dark palette.
    /// </summary>
    public ThemePaletteDto Dark { get; init; } = new();

    /// <summary>
    /// Theme font definitions.
    /// </summary>
    public ThemeFontsDto Fonts { get; init; } = new();

    /// <summary>
    /// Heading sizes for h1-h6.
    /// </summary>
    public ThemeHeadingSizesDto HeadingSizes { get; init; } = new();

    /// <summary>
    /// Heading text transforms for h1-h6.
    /// </summary>
    public ThemeHeadingTransformsDto HeadingTransforms { get; init; } = new();

    /// <summary>
    /// Base text size for paragraphs and labels.
    /// </summary>
    public string BodyTextSize { get; init; } = string.Empty;

    /// <summary>
    /// Corner radius for cards and hero blocks.
    /// </summary>
    public string CornerRadius { get; init; } = string.Empty;
}

/// <summary>
/// Theme update request.
/// </summary>
public sealed record ThemeUpdateRequest
{
    /// <summary>
    /// Display name for the theme.
    /// </summary>
    public string? DisplayName { get; init; }

    /// <summary>
    /// Whether the theme is private.
    /// </summary>
    public bool? IsPrivate { get; init; }

    /// <summary>
    /// Username for private themes (admin only).
    /// </summary>
    public string? CreatedBy { get; init; }

    /// <summary>
    /// Default mode.
    /// </summary>
    public string? DefaultMode { get; init; }

    /// <summary>
    /// Light palette.
    /// </summary>
    public ThemePaletteDto? Light { get; init; }

    /// <summary>
    /// Dark palette.
    /// </summary>
    public ThemePaletteDto? Dark { get; init; }

    /// <summary>
    /// Theme font definitions.
    /// </summary>
    public ThemeFontsDto? Fonts { get; init; }

    /// <summary>
    /// Heading sizes for h1-h6.
    /// </summary>
    public ThemeHeadingSizesDto? HeadingSizes { get; init; }

    /// <summary>
    /// Heading text transforms for h1-h6.
    /// </summary>
    public ThemeHeadingTransformsDto? HeadingTransforms { get; init; }

    /// <summary>
    /// Base text size for paragraphs and labels.
    /// </summary>
    public string? BodyTextSize { get; init; }

    /// <summary>
    /// Corner radius for cards and hero blocks.
    /// </summary>
    public string? CornerRadius { get; init; }
}
