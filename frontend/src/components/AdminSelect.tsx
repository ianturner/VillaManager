"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

type AdminSelectOption = {
  value: string;
  label: string;
};

type AdminSelectProps = {
  value: string;
  options: AdminSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export default function AdminSelect({
  value,
  options,
  onChange,
  disabled = false,
  placeholder
}: AdminSelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const lastSelectionAtRef = useRef<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const selectedIndex = useMemo(
    () => Math.max(0, options.findIndex((option) => option.value === value)),
    [options, value]
  );

  const selectedLabel = options[selectedIndex]?.label ?? placeholder ?? "Select";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const openMenu = () => {
    if (disabled) {
      return;
    }
    setIsOpen(true);
    setHighlightedIndex(selectedIndex);
  };

  const closeMenu = () => {
    if (disabled) {
      return;
    }
    setIsOpen(false);
  };

  const selectOption = (index: number) => {
    if (disabled) {
      return;
    }
    const option = options[index];
    if (!option) {
      return;
    }
    onChange(option.value);
    lastSelectionAtRef.current = Date.now();
    setIsOpen(false);
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
      } else {
        selectOption(highlightedIndex);
      }
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      openMenu();
    }
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, options.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      selectOption(highlightedIndex);
    }
  };

  return (
    <div className="admin-select" ref={rootRef}>
      <button
        type="button"
        className="admin-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => {
          if (Date.now() - lastSelectionAtRef.current < 200) {
            return;
          }
          if (isOpen) {
            closeMenu();
          } else {
            openMenu();
          }
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        {selectedLabel}
      </button>
      {isOpen ? (
        <ul
          id={listboxId}
          className="admin-select-menu"
          role="listbox"
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightedIndex;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                className={`admin-select-option${isHighlighted ? " active" : ""}${
                  isSelected ? " selected" : ""
                }`}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  selectOption(index);
                }}
              >
                {option.label}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
