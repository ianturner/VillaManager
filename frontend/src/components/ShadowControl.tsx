"use client";

import { useEffect, useState } from "react";

/**
 * Parses a CSS box-shadow or text-shadow value into numeric components and color.
 * Supports: "none" or "xpx ypx blurpx rgba(r,g,b,a)" / "xpx ypx blurpx rgb(r,g,b)" / "xpx ypx blurpx #hex"
 */
export function parseShadow(value: string | null | undefined): {
  x: number;
  y: number;
  blur: number;
  r: number;
  g: number;
  b: number;
  opacity: number;
} | null {
  const trimmed = (value ?? "").trim().toLowerCase();
  if (!trimmed || trimmed === "none") {
    return null;
  }
  const shadowMatch = trimmed.match(
    /^(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px\s+(.+)$/
  );
  if (!shadowMatch) {
    return null;
  }
  const x = Number.parseFloat(shadowMatch[1]) || 0;
  const y = Number.parseFloat(shadowMatch[2]) || 0;
  const blur = Number.parseFloat(shadowMatch[3]) || 0;
  const colorPart = shadowMatch[4].trim();

  let r = 0;
  let g = 0;
  let b = 0;
  let opacity = 1;

  const rgbaMatch = colorPart.match(
    /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/
  );
  if (rgbaMatch) {
    r = Math.min(255, Math.max(0, parseInt(rgbaMatch[1], 10)));
    g = Math.min(255, Math.max(0, parseInt(rgbaMatch[2], 10)));
    b = Math.min(255, Math.max(0, parseInt(rgbaMatch[3], 10)));
    opacity = rgbaMatch[4] != null ? Math.min(1, Math.max(0, parseFloat(rgbaMatch[4]))) : 1;
  } else {
    const hexMatch = colorPart.match(/^#([0-9a-f]{6})$/i) || colorPart.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
    if (hexMatch) {
      const hex = hexMatch[1];
      if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
      } else {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      }
    }
  }

  return { x, y, blur, r, g, b, opacity };
}

const toHex = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0");

/**
 * Builds a CSS shadow string from components (for box-shadow / text-shadow).
 */
export function shadowToCss(params: {
  x: number;
  y: number;
  blur: number;
  r: number;
  g: number;
  b: number;
  opacity: number;
}): string {
  const { x, y, blur, r, g, b, opacity } = params;
  return `${x}px ${y}px ${blur}px rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${opacity.toFixed(2)})`;
}

const defaultShadow = {
  x: 5,
  y: 5,
  blur: 20,
  r: 35,
  g: 35,
  b: 35,
  opacity: 0.08
};

type ShadowControlProps = {
  label: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Optional i18n labels for sub-fields; falls back to X, Y, Blur, Opacity, None */
  labels?: { x?: string; y?: string; blur?: string; opacity?: string; none?: string };
};

export default function ShadowControl({
  label,
  value,
  onChange,
  disabled = false,
  labels = {}
}: ShadowControlProps) {
  const parsed = parseShadow(value);
  const isNone = parsed === null;
  const effective = parsed ?? defaultShadow;

  const [x, setX] = useState(effective.x);
  const [y, setY] = useState(effective.y);
  const [blur, setBlur] = useState(effective.blur);
  const [r, setR] = useState(effective.r);
  const [g, setG] = useState(effective.g);
  const [b, setB] = useState(effective.b);
  const [opacity, setOpacity] = useState(effective.opacity);

  // Sync from value when it changes externally (e.g. theme switch)
  useEffect(() => {
    const p = parseShadow(value);
    if (p) {
      setX(p.x);
      setY(p.y);
      setBlur(p.blur);
      setR(p.r);
      setG(p.g);
      setB(p.b);
      setOpacity(p.opacity);
    } else {
      setX(defaultShadow.x);
      setY(defaultShadow.y);
      setBlur(defaultShadow.blur);
      setR(defaultShadow.r);
      setG(defaultShadow.g);
      setB(defaultShadow.b);
      setOpacity(defaultShadow.opacity);
    }
  }, [value]);

  const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

  const commit = (params: {
    x: number;
    y: number;
    blur: number;
    r: number;
    g: number;
    b: number;
    opacity: number;
  }) => {
    onChange(shadowToCss(params));
  };

  const handleColorChange = (hex: string) => {
    const match = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!match) return;
    const rn = parseInt(match[1], 16);
    const gn = parseInt(match[2], 16);
    const bn = parseInt(match[3], 16);
    setR(rn);
    setG(gn);
    setB(bn);
    commit({ x, y, blur, r: rn, g: gn, b: bn, opacity });
  };

  const xLabel = labels.x ?? "X";
  const yLabel = labels.y ?? "Y";
  const blurLabel = labels.blur ?? "Blur";
  const opacityLabel = labels.opacity ?? "Opacity";
  const noneLabel = labels.none ?? "None";

  return (
    <div className="admin-field admin-shadow-control">
      <div className="admin-shadow-control-header">
        <span>{label}</span>
        <label className="admin-shadow-control-none">
          <input
            type="checkbox"
            checked={isNone}
            disabled={disabled}
            onChange={(e) => {
              if (e.target.checked) {
                onChange("none");
              } else {
                commit({
                  x: effective.x,
                  y: effective.y,
                  blur: effective.blur,
                  r: effective.r,
                  g: effective.g,
                  b: effective.b,
                  opacity: effective.opacity
                });
              }
            }}
          />
          {noneLabel}
        </label>
      </div>
      {!isNone && (
        <div className="admin-shadow-control-inputs">
          <label className="admin-shadow-control-color">
            <span>Color</span>
            <input
              type="color"
              value={hexColor}
              disabled={disabled}
              onChange={(e) => handleColorChange(e.target.value)}
            />
          </label>
          <label className="admin-shadow-control-number">
            <span>{xLabel}</span>
            <input
              type="number"
              value={x}
              disabled={disabled}
              step={1}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!Number.isNaN(v)) {
                  setX(v);
                  commit({ ...effective, x: v });
                }
              }}
            />
          </label>
          <label className="admin-shadow-control-number">
            <span>{yLabel}</span>
            <input
              type="number"
              value={y}
              disabled={disabled}
              step={1}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!Number.isNaN(v)) {
                  setY(v);
                  commit({ ...effective, y: v });
                }
              }}
            />
          </label>
          <label className="admin-shadow-control-number">
            <span>{blurLabel}</span>
            <input
              type="number"
              value={blur}
              disabled={disabled}
              min={0}
              step={1}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!Number.isNaN(v) && v >= 0) {
                  setBlur(v);
                  commit({ ...effective, blur: v });
                }
              }}
            />
          </label>
          <label className="admin-shadow-control-number">
            <span>{opacityLabel}</span>
            <input
              type="number"
              value={Math.round(opacity * 100)}
              disabled={disabled}
              min={0}
              max={100}
              step={5}
              onChange={(e) => {
                const v = parseFloat(e.target.value) / 100;
                if (!Number.isNaN(v)) {
                  const o = Math.min(1, Math.max(0, v));
                  setOpacity(o);
                  commit({ ...effective, opacity: o });
                }
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
