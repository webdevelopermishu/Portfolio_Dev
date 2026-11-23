"use client";

import { useEffect, useRef } from "react";
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Pilcrow, Quote, RemoveFormatting } from "lucide-react";

/**
 * Small dependency-free rich text editor (contentEditable). Output is always
 * sanitised on the server before it is stored.
 */
export function RichText({ value, onChange, id }: { value: string; onChange: (html: string) => void; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  // Only push external values in when they differ, so the caret is not reset while typing.
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
  }, [value]);

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    onChange(ref.current?.innerHTML ?? "");
  };
  const tools: [string, React.ComponentType<{ className?: string }>, () => void][] = [
    ["Bold", Bold, () => exec("bold")],
    ["Italic", Italic, () => exec("italic")],
    ["Heading", Heading2, () => exec("formatBlock", "h2")],
    ["Subheading", Heading3, () => exec("formatBlock", "h3")],
    ["Paragraph", Pilcrow, () => exec("formatBlock", "p")],
    ["Bulleted list", List, () => exec("insertUnorderedList")],
    ["Numbered list", ListOrdered, () => exec("insertOrderedList")],
    ["Quote", Quote, () => exec("formatBlock", "blockquote")],
    ["Link", Link2, () => {
      const url = window.prompt("Link URL (https://…)");
      if (url && /^(https?:\/\/|mailto:)/i.test(url)) exec("createLink", url);
    }],
    ["Clear formatting", RemoveFormatting, () => exec("removeFormat")],
  ];

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#d9dce5] bg-white focus-within:border-[#0f1524]">
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap gap-0.5 border-b border-[#e6e8ef] bg-[#f8f9fb] p-1.5">
        {tools.map(([label, Icon, run]) => (
          <button key={label} type="button" title={label} aria-label={label} onMouseDown={(e) => e.preventDefault()} onClick={run} className="rounded-md p-1.5 text-gray-700 hover:bg-white hover:shadow-sm">
            <Icon className="size-4" />
          </button>
        ))}
      </div>
      <div
        id={id}
        ref={ref}
        role="textbox"
        aria-multiline="true"
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onPaste={(e) => {
          // Paste as plain text so formatting from other apps does not leak in.
          e.preventDefault();
          document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
        }}
        className="prose-site min-h-[220px] max-w-none px-4 py-3 text-sm text-[#0f1524] outline-none [&_h2]:text-xl [&_h3]:text-lg"
      />
    </div>
  );
}
