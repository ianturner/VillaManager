import type {
  ThemeDto,
  ThemeFont,
  ThemeFonts,
  ThemeHeadingSizes,
  ThemeHeadingTransforms,
  ThemePalette
} from "@/lib/types";

const defaultLight: ThemePalette = {
  background: "#f1f3f5",
  surface: "#2e67845c",
  text: "#2d3037",
  muted: "#475569",
  primary: "#1d9537",
  accent: "#2e6785",
  border: "#e2e8f0",
  shadow: "0 20px 50px rgba(15, 23, 42, 0.12)",
  textShadow: "none"
};

const defaultDark: ThemePalette = {
  background: "#353437",
  surface: "#45beff47",
  text: "#95daff",
  muted: "#94a3b8",
  primary: "#26d331",
  accent: "#46beff",
  border: "#2b2b2b",
  shadow: "0 18px 40px rgba(0, 0, 0, 0.45)",
  textShadow: "0 2px 10px rgba(0, 0, 0, 0.6)"
};

const defaultFont: ThemeFont = {
  family: "system-ui",
  src: null,
  format: null,
  weight: "normal",
  style: "normal"
};

const defaultFonts: ThemeFonts = {
  base: defaultFont,
  title: defaultFont,
  subtitle: defaultFont
};

const defaultHeadingSizes: ThemeHeadingSizes = {
  h1: "2.8rem",
  h2: "2.2rem",
  h3: "1.8rem",
  h4: "1.6rem",
  h5: "1.4rem",
  h6: "1.2rem"
};

const defaultHeadingTransforms: ThemeHeadingTransforms = {
  h1: "uppercase",
  h2: "uppercase",
  h3: "uppercase",
  h4: "none",
  h5: "none",
  h6: "none"
};

const defaultTheme: ThemeDto = {
  name: "default",
  defaultMode: "light",
  light: defaultLight,
  dark: defaultDark,
  fonts: defaultFonts,
  headingSizes: defaultHeadingSizes,
  headingTransforms: defaultHeadingTransforms,
  bodyTextSize: "14px",
  cornerRadius: "15px"
};

const mergeFonts = (fonts?: ThemeFonts | null): ThemeFonts => ({
  base: { ...defaultFonts.base, ...(fonts?.base ?? {}) },
  title: { ...defaultFonts.title, ...(fonts?.title ?? {}) },
  subtitle: { ...defaultFonts.subtitle, ...(fonts?.subtitle ?? {}) }
});

const mergeHeadingSizes = (sizes?: ThemeHeadingSizes | null): ThemeHeadingSizes => ({
  ...defaultHeadingSizes,
  ...(sizes ?? {})
});

const mergeHeadingTransforms = (
  transforms?: ThemeHeadingTransforms | null
): ThemeHeadingTransforms => ({
  ...defaultHeadingTransforms,
  ...(transforms ?? {})
});

export function resolveTheme(theme?: ThemeDto | null): ThemeDto {
  if (!theme) {
    return defaultTheme;
  }

  return {
    name: theme.name ?? defaultTheme.name,
    defaultMode: theme.defaultMode ?? defaultTheme.defaultMode,
    light: { ...defaultTheme.light, ...theme.light },
    dark: { ...defaultTheme.dark, ...theme.dark },
    fonts: mergeFonts(theme.fonts),
    headingSizes: mergeHeadingSizes(theme.headingSizes),
    headingTransforms: mergeHeadingTransforms(theme.headingTransforms),
    bodyTextSize: theme.bodyTextSize ?? defaultTheme.bodyTextSize,
    cornerRadius: theme.cornerRadius ?? defaultTheme.cornerRadius
  };
}
