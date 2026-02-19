"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

type FacilityIconOption = {
  value: string;
  label: string;
};

type FacilityIconPickerProps = {
  options: FacilityIconOption[];
  selected: string;
  onSelect: (value: string) => void;
  header?: ReactNode;
  totalCount?: number;
};

export default function FacilityIconPicker({
  options,
  selected,
  onSelect,
  header,
  totalCount
}: FacilityIconPickerProps) {
  const [query, setQuery] = useState("");

  const normalizeValue = (value: string) =>
    value.includes(":") ? value : `solid:${value || "circle-check"}`;

  const getIconClassName = (value: string) => {
    const normalized = normalizeValue(value);
    const [style, name] = normalized.split(":");
    const styleClass =
      style === "brands" ? "fa-brands" : style === "regular" ? "fa-regular" : "fa-solid";
    return `${styleClass} fa-${name || "circle-check"}`;
  };

  const selectedValue = normalizeValue(selected);
  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return options;
    }
    return options.filter((option) => {
      const label = option.label.toLowerCase();
      const value = option.value.toLowerCase();
      return label.includes(term) || value.includes(term);
    });
  }, [options, query]);

  return (
    <div className="admin-icon-picker">
      <div className="admin-icon-picker-toolbar">
        <div className="admin-icon-picker-header">{header ? header : null}</div>
        <label className="admin-icon-search">
          <span>Search</span>
          <input
            type="search"
            value={query}
            placeholder={`Search ${totalCount ?? options.length} icons`}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <div className="admin-icon-grid" role="listbox" aria-label="Facility icons">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`admin-icon-option${
                option.value === selectedValue ? " selected" : ""
              }`}
              title={option.label}
              aria-label={option.label}
              aria-pressed={option.value === selectedValue}
              onClick={() => onSelect(option.value)}
            >
              <i className={getIconClassName(option.value)} aria-hidden="true" />
            </button>
          ))
        ) : (
          <div className="admin-icon-empty">No icons match your search.</div>
        )}
      </div>
    </div>
  );
}
