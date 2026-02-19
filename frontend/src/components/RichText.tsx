import React from "react";
import { resolveImageUrl } from "@/lib/api";

type RichTextProps = {
  text: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  propertyId?: string;
};

type EmphasisToken = {
  content: string;
  style: "bold" | "italic";
};

const emphasisPattern = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
const linkPattern = /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)/g;

function sanitizeHref(rawHref: string) {
  const href = rawHref.trim();
  if (/^(https?:\/\/|mailto:|\/)/i.test(href)) {
    return href;
  }

  return null;
}

function sanitizeSrc(rawSrc: string) {
  const src = rawSrc.trim();
  if (/^(https?:\/\/|\/)/i.test(src)) {
    return src;
  }

  return null;
}

function splitEmphasis(text: string): (string | EmphasisToken)[] {
  const tokens: (string | EmphasisToken)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = emphasisPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      tokens.push({ content: match[1], style: "bold" });
    } else if (match[2]) {
      tokens.push({ content: match[2], style: "italic" });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens;
}

function renderEmphasis(tokens: (string | EmphasisToken)[], keyPrefix: string) {
  return tokens.map((token, index) => {
    if (typeof token === "string") {
      return token;
    }

    const key = `${keyPrefix}-em-${index}`;
    if (token.style === "bold") {
      return <strong key={key}>{token.content}</strong>;
    }

    return <em key={key}>{token.content}</em>;
  });
}

function renderRichText(text: string, propertyId?: string) {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let linkIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index);
      nodes.push(...renderEmphasis(splitEmphasis(before), `rich-${linkIndex}-before`));
    }

    const imageAlt = match[1];
    const rawImageSrc = match[2];
    const linkLabel = match[3];
    const rawLinkHref = match[4];

    if (rawImageSrc) {
      const safeSrc = sanitizeSrc(rawImageSrc);
      if (safeSrc) {
        const resolvedSrc = propertyId ? resolveImageUrl(propertyId, safeSrc) : safeSrc;
        nodes.push(
          <img
            key={`rich-${linkIndex}-image`}
            className="rich-text-image"
            src={resolvedSrc}
            alt={imageAlt ?? ""}
          />
        );
      } else {
        nodes.push(...renderEmphasis(splitEmphasis(match[0]), `rich-${linkIndex}-raw`));
      }
    } else if (linkLabel && rawLinkHref) {
      const href = sanitizeHref(rawLinkHref);
      if (href) {
        const isExternal = /^https?:\/\//i.test(href);
        nodes.push(
          <a
            key={`rich-${linkIndex}-link`}
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noreferrer" : undefined}
          >
            {renderEmphasis(splitEmphasis(linkLabel), `rich-${linkIndex}-label`)}
          </a>
        );
      } else {
        nodes.push(...renderEmphasis(splitEmphasis(match[0]), `rich-${linkIndex}-raw`));
      }
    } else {
      nodes.push(...renderEmphasis(splitEmphasis(match[0]), `rich-${linkIndex}-raw`));
    }

    lastIndex = match.index + match[0].length;
    linkIndex += 1;
  }

  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    nodes.push(...renderEmphasis(splitEmphasis(remaining), `rich-${linkIndex}-tail`));
  }

  return nodes;
}

export default function RichText({
  text,
  as = "span",
  className,
  propertyId
}: RichTextProps) {
  const mergedClassName = ["rich-text", className].filter(Boolean).join(" ");
  return React.createElement(as, { className: mergedClassName }, renderRichText(text, propertyId));
}
