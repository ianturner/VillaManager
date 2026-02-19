"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

export type GuestCollapsibleSectionProps = {
  title: React.ReactNode;
  showLabel: string;
  hideLabel: string;
  expandAriaLabel: string;
  collapseAriaLabel: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  /** Notify parent when expanded state changes (e.g. for syncing card class in CollapsibleCard). */
  onExpandedChange?: (expanded: boolean) => void;
};

/**
 * A collapsible section with a Show/Hide button in the header.
 * Used on the guest info page so guests can expand/collapse each section.
 */
export function GuestCollapsibleSection({
  title,
  showLabel,
  hideLabel,
  expandAriaLabel,
  collapseAriaLabel,
  children,
  defaultExpanded = true,
  className = "",
  onExpandedChange
}: GuestCollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      onExpandedChange?.(next);
      return next;
    });
  };

  return (
    <div className={`guest-collapsible-section ${className} ${expanded ? "expanded" : "collapsed"}`.trim()}>
      <div className="guest-section-header">
        <div className="guest-section-title">{title}</div>
        <button
          type="button"
          className="guest-section-toggle"
          aria-label={expanded ? collapseAriaLabel : expandAriaLabel}
          onClick={handleToggle}
        >
          {expanded ? (
            <FontAwesomeIcon icon={faEyeSlash} />
          ) : (
            <FontAwesomeIcon icon={faEye} />
          )}
          <span>{expanded ? hideLabel : showLabel}</span>
        </button>
      </div>
      {expanded ? <div className="guest-section-content">{children}</div> : null}
    </div>
  );
}

/**
 * Wraps GuestCollapsibleSection in a div.card and toggles the card's class based on expanded state.
 * Use anywhere you want a collapsible card (e.g. guest page, admin). Pass the same props as GuestCollapsibleSection;
 * optional cardClassName is applied to the outer card div in addition to "card", "expanded" / "collapsed".
 */
export function CollapsibleCard({
  defaultExpanded = true,
  className: cardClassName = "",
  ...sectionProps
}: GuestCollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      className={`card ${expanded ? "expanded" : "collapsed"} ${cardClassName}`.trim()}
      data-expanded={expanded}
    >
      <GuestCollapsibleSection
        {...sectionProps}
        defaultExpanded={defaultExpanded}
        onExpandedChange={setExpanded}
      />
    </div>
  );
}
