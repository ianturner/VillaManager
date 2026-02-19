 "use client";

import { useCallback, useEffect, useRef, useState } from "react";
 import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
 import { faBold, faItalic, faLink, faImage } from "@fortawesome/free-solid-svg-icons";

 type RichTextEditorProps = {
   id?: string;
   value: string;
   rows?: number;
   placeholder?: string;
   disabled?: boolean;
   onFocus?: () => void;
   onChange: (value: string) => void;
 };

 type SelectionRange = {
   start: number;
   end: number;
 };

 const LINK_PLACEHOLDER = "https://example.com";

 function getSelection(textarea: HTMLTextAreaElement): SelectionRange {
   return { start: textarea.selectionStart ?? 0, end: textarea.selectionEnd ?? 0 };
 }

function setSelection(
  textarea: HTMLTextAreaElement,
  range: SelectionRange,
  scrollTop: number
) {
  requestAnimationFrame(() => {
    try {
      textarea.focus({ preventScroll: true });
    } catch {
      textarea.focus();
    }
    textarea.setSelectionRange(range.start, range.end);
    textarea.scrollTop = scrollTop;
  });
}

 function insertText(
   value: string,
   range: SelectionRange,
   nextText: string
 ): { nextValue: string; nextRange: SelectionRange } {
   const before = value.slice(0, range.start);
   const after = value.slice(range.end);
   const nextValue = `${before}${nextText}${after}`;
   const cursor = range.start + nextText.length;
   return { nextValue, nextRange: { start: cursor, end: cursor } };
 }

 function wrapSelection(
   value: string,
   range: SelectionRange,
   marker: string,
   preferPlainItalic = false
 ): { nextValue: string; nextRange: SelectionRange } {
   const selected = value.slice(range.start, range.end);
   if (!selected) {
     const placeholder = preferPlainItalic ? "italic text" : "bold text";
     const wrapped = `${marker}${placeholder}${marker}`;
     return insertText(value, range, wrapped);
   }

   const startsWith = selected.startsWith(marker);
   const endsWith = selected.endsWith(marker);
   const isBoldWrapped = selected.startsWith("**") && selected.endsWith("**");
   if (startsWith && endsWith && (!preferPlainItalic || !isBoldWrapped)) {
     const unwrapped = selected.slice(marker.length, selected.length - marker.length);
     const nextValue = `${value.slice(0, range.start)}${unwrapped}${value.slice(range.end)}`;
     const nextRange = { start: range.start, end: range.start + unwrapped.length };
     return { nextValue, nextRange };
   }

   const wrapped = `${marker}${selected}${marker}`;
   const nextValue = `${value.slice(0, range.start)}${wrapped}${value.slice(range.end)}`;
   const nextRange = { start: range.start, end: range.start + wrapped.length };
   return { nextValue, nextRange };
 }

 export default function RichTextEditor({
   id,
   value,
   rows = 3,
   placeholder,
   disabled,
   onFocus,
   onChange
 }: RichTextEditorProps) {
   const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingSelectionRef = useRef<{ range: SelectionRange; scrollTop: number } | null>(
    null
  );
  const [isFocused, setIsFocused] = useState(false);

   const applyUpdate = useCallback(
     (nextValue: string, range?: SelectionRange) => {
       onChange(nextValue);
      if (textareaRef.current && range) {
        pendingSelectionRef.current = {
          range,
          scrollTop: textareaRef.current.scrollTop
        };
      }
     },
     [onChange]
   );

  useEffect(() => {
    const textarea = textareaRef.current;
    const pending = pendingSelectionRef.current;
    if (!textarea || !pending) {
      return;
    }
    pendingSelectionRef.current = null;
    setSelection(textarea, pending.range, pending.scrollTop);
  }, [value]);

   const handleBold = useCallback(() => {
     const textarea = textareaRef.current;
     if (!textarea || disabled) return;
     const range = getSelection(textarea);
     const { nextValue, nextRange } = wrapSelection(value, range, "**");
     applyUpdate(nextValue, nextRange);
   }, [applyUpdate, disabled, value]);

   const handleItalic = useCallback(() => {
     const textarea = textareaRef.current;
     if (!textarea || disabled) return;
     const range = getSelection(textarea);
     const { nextValue, nextRange } = wrapSelection(value, range, "*", true);
     applyUpdate(nextValue, nextRange);
   }, [applyUpdate, disabled, value]);

   const handleLink = useCallback(() => {
     const textarea = textareaRef.current;
     if (!textarea || disabled) return;
     const range = getSelection(textarea);
     const selected = value.slice(range.start, range.end) || "Link label";
     const linkText = `[${selected}](${LINK_PLACEHOLDER})`;
     const { nextValue, nextRange } = insertText(value, range, linkText);
     const linkStart = range.start + selected.length + 3;
     const linkEnd = linkStart + LINK_PLACEHOLDER.length;
     applyUpdate(nextValue, { start: linkStart, end: linkEnd });
   }, [applyUpdate, disabled, value]);

   const handleImage = useCallback(() => {
     const textarea = textareaRef.current;
     if (!textarea || disabled) return;
     const range = getSelection(textarea);
     const selected = value.slice(range.start, range.end) || "Image hover text";
     const imageText = `![${selected}](${LINK_PLACEHOLDER}/image.jpg)`;
     const { nextValue } = insertText(value, range, imageText);
     const linkStart = range.start + selected.length + 4;
     const linkEnd = linkStart + LINK_PLACEHOLDER.length;
     applyUpdate(nextValue, { start: linkStart, end: linkEnd });
   }, [applyUpdate, disabled, value]);

  return (
    <div
      className={`admin-rich-text${disabled ? " admin-rich-text-disabled" : ""}${
        isFocused ? " is-focused" : ""
      }`}
    >
      <div
        className="admin-rich-text-toolbar"
        role="toolbar"
        aria-label="Text formatting"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
         <button type="button" onClick={handleBold} disabled={disabled} aria-label="Bold">
           <FontAwesomeIcon icon={faBold} />
         </button>
         <button type="button" onClick={handleItalic} disabled={disabled} aria-label="Italic">
           <FontAwesomeIcon icon={faItalic} />
         </button>
         <button type="button" onClick={handleLink} disabled={disabled} aria-label="Insert link">
           <FontAwesomeIcon icon={faLink} />
         </button>
         <button type="button" onClick={handleImage} disabled={disabled} aria-label="Insert image">
           <FontAwesomeIcon icon={faImage} />
         </button>
       </div>
       <textarea
         ref={textareaRef}
         id={id}
         rows={rows}
         value={value}
         placeholder={placeholder}
        onFocus={() => {
          setIsFocused(true);
          onFocus?.();
        }}
        onBlur={() => setIsFocused(false)}
         disabled={disabled}
         onChange={(event) => onChange(event.target.value)}
       />
     </div>
   );
 }
