// PropertyManager.Application - DTOs
namespace PropertyManager.Application.Contracts;

/// <summary>
/// Represents a property theme configuration.
/// </summary>
public sealed record ThemeDto
{
    /// <summary>
    /// Theme name.
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// Default mode ("light" or "dark").
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
/// Theme palette values.
/// </summary>
public sealed record ThemePaletteDto
{
    /// <summary>
    /// Background color.
    /// </summary>
    public string Background { get; init; } = string.Empty;

    /// <summary>
    /// Surface color.
    /// </summary>
    public string Surface { get; init; } = string.Empty;

    /// <summary>
    /// Text color.
    /// </summary>
    public string Text { get; init; } = string.Empty;

    /// <summary>
    /// Muted text color.
    /// </summary>
    public string Muted { get; init; } = string.Empty;

    /// <summary>
    /// Primary color.
    /// </summary>
    public string Primary { get; init; } = string.Empty;

    /// <summary>
    /// Accent color.
    /// </summary>
    public string Accent { get; init; } = string.Empty;

    /// <summary>
    /// Border color.
    /// </summary>
    public string Border { get; init; } = string.Empty;

    /// <summary>
    /// Shadow definition.
    /// </summary>
    public string Shadow { get; init; } = string.Empty;

    /// <summary>
    /// Text shadow definition.
    /// </summary>
    public string TextShadow { get; init; } = string.Empty;
}

/// <summary>
/// Theme font definitions.
/// </summary>
public sealed record ThemeFontsDto
{
    /// <summary>
    /// Base font for body text.
    /// </summary>
    public ThemeFontDto Base { get; init; } = new();

    /// <summary>
    /// Title font for h1 and h2.
    /// </summary>
    public ThemeFontDto Title { get; init; } = new();

    /// <summary>
    /// Subtitle font for h3-h6.
    /// </summary>
    public ThemeFontDto Subtitle { get; init; } = new();
}

/// <summary>
/// Heading size definitions.
/// </summary>
public sealed record ThemeHeadingSizesDto
{
    /// <summary>
    /// Font size for h1.
    /// </summary>
    public string H1 { get; init; } = string.Empty;

    /// <summary>
    /// Font size for h2.
    /// </summary>
    public string H2 { get; init; } = string.Empty;

    /// <summary>
    /// Font size for h3.
    /// </summary>
    public string H3 { get; init; } = string.Empty;

    /// <summary>
    /// Font size for h4.
    /// </summary>
    public string H4 { get; init; } = string.Empty;

    /// <summary>
    /// Font size for h5.
    /// </summary>
    public string H5 { get; init; } = string.Empty;

    /// <summary>
    /// Font size for h6.
    /// </summary>
    public string H6 { get; init; } = string.Empty;
}

/// <summary>
/// Heading text transform definitions.
/// </summary>
public sealed record ThemeHeadingTransformsDto
{
    /// <summary>
    /// Text transform for h1.
    /// </summary>
    public string H1 { get; init; } = string.Empty;

    /// <summary>
    /// Text transform for h2.
    /// </summary>
    public string H2 { get; init; } = string.Empty;

    /// <summary>
    /// Text transform for h3.
    /// </summary>
    public string H3 { get; init; } = string.Empty;

    /// <summary>
    /// Text transform for h4.
    /// </summary>
    public string H4 { get; init; } = string.Empty;

    /// <summary>
    /// Text transform for h5.
    /// </summary>
    public string H5 { get; init; } = string.Empty;

    /// <summary>
    /// Text transform for h6.
    /// </summary>
    public string H6 { get; init; } = string.Empty;
}

/// <summary>
/// Font definition.
/// </summary>
public sealed record ThemeFontDto
{
    /// <summary>
    /// Font family name.
    /// </summary>
    public string Family { get; init; } = string.Empty;

    /// <summary>
    /// Font file URL.
    /// </summary>
    public string Src { get; init; } = string.Empty;

    /// <summary>
    /// Font file format (e.g. truetype, opentype).
    /// </summary>
    public string Format { get; init; } = string.Empty;

    /// <summary>
    /// Font weight.
    /// </summary>
    public string Weight { get; init; } = "normal";

    /// <summary>
    /// Font style.
    /// </summary>
    public string Style { get; init; } = "normal";
}
