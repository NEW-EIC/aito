"use client";

import type { Editor } from "@tiptap/react";
import { useRef } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Undo,
  Redo,
  Code2,
  Image as ImageIcon,
} from "lucide-react";

export interface ToolbarLabels {
  bold: string;
  italic: string;
  underline: string;
  strike: string;
  code: string;
  h2: string;
  h3: string;
  bulletList: string;
  orderedList: string;
  blockquote: string;
  divider: string;
  link: string;
  unlink: string;
  alignLeft: string;
  alignCenter: string;
  alignRight: string;
  color: string;
  highlight: string;
  undo: string;
  redo: string;
  codeBlock: string;
  linkPrompt: string;
  image: string;
}

interface Props {
  editor: Editor | null;
  labels: ToolbarLabels;
  /** Called when the user picks a file from the image-upload button.
   *  The Editor wraps the same `insertImageAtPosition` used by
   *  drag-drop / paste — keeps one upload code path. */
  onUploadImage?: (file: File) => void | Promise<void>;
}

// A small palette — enough for editorial colour-coding without overwhelm.
const COLOURS = [
  { label: "default", value: "" },
  { label: "red", value: "#dc2626" },
  { label: "amber", value: "#d97706" },
  { label: "green", value: "#059669" },
  { label: "blue", value: "#2563eb" },
  { label: "purple", value: "#7c3aed" },
  { label: "muted", value: "#6b7280" },
];

const HIGHLIGHTS = [
  { label: "yellow", value: "#fef08a" },
  { label: "green", value: "#bbf7d0" },
  { label: "blue", value: "#bfdbfe" },
  { label: "pink", value: "#fbcfe8" },
];

export function Toolbar({ editor, labels, onUploadImage }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!editor) {
    return (
      <div className="h-11 border-b border-border bg-bg-alt/40" />
    );
  }
  const ed = editor; // local alias TS can narrow through into the closure below

  // Promote link: if there's a selection, wrap it; if there's no selection,
  // prompt for both URL and label and insert anew.
  const setLink = () => {
    const previous = ed.getAttributes("link").href as string | undefined;
    const url = window.prompt(labels.linkPrompt, previous ?? "https://");
    if (url === null) return; // cancelled
    if (url === "") {
      ed.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    ed.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-bg-alt/30 px-2 py-1.5">
      <Group>
        <Btn
          label={labels.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <Bold className="size-4" />
        </Btn>
        <Btn
          label={labels.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <Italic className="size-4" />
        </Btn>
        <Btn
          label={labels.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
        >
          <UnderlineIcon className="size-4" />
        </Btn>
        <Btn
          label={labels.strike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
        >
          <Strikethrough className="size-4" />
        </Btn>
        <Btn
          label={labels.code}
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
        >
          <Code className="size-4" />
        </Btn>
      </Group>

      <Divider />

      <Group>
        <Btn
          label={labels.h2}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
        >
          <Heading2 className="size-4" />
        </Btn>
        <Btn
          label={labels.h3}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor.isActive("heading", { level: 3 })}
        >
          <Heading3 className="size-4" />
        </Btn>
        <Btn
          label={labels.bulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          <List className="size-4" />
        </Btn>
        <Btn
          label={labels.orderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          <ListOrdered className="size-4" />
        </Btn>
        <Btn
          label={labels.blockquote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        >
          <Quote className="size-4" />
        </Btn>
        <Btn
          label={labels.codeBlock}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
        >
          <Code2 className="size-4" />
        </Btn>
        <Btn
          label={labels.divider}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="size-4" />
        </Btn>
      </Group>

      <Divider />

      <Group>
        <Btn
          label={labels.alignLeft}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
        >
          <AlignLeft className="size-4" />
        </Btn>
        <Btn
          label={labels.alignCenter}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
        >
          <AlignCenter className="size-4" />
        </Btn>
        <Btn
          label={labels.alignRight}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
        >
          <AlignRight className="size-4" />
        </Btn>
      </Group>

      <Divider />

      <Group>
        <Btn label={labels.link} onClick={setLink} active={editor.isActive("link")}>
          <LinkIcon className="size-4" />
        </Btn>
        <Btn
          label={labels.unlink}
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive("link")}
        >
          <Unlink className="size-4" />
        </Btn>
        {onUploadImage && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onUploadImage(file);
                // Reset so picking the same file twice still fires.
                e.target.value = "";
              }}
            />
            <Btn
              label={labels.image}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="size-4" />
            </Btn>
          </>
        )}
      </Group>

      <Divider />

      <ColourSwatches editor={editor} label={labels.color} />

      <HighlightSwatches editor={editor} label={labels.highlight} />

      <Divider />

      <Group>
        <Btn
          label={labels.undo}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="size-4" />
        </Btn>
        <Btn
          label={labels.redo}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="size-4" />
        </Btn>
      </Group>
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-border" />;
}

function Btn({
  label,
  onClick,
  active,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active ?? false}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex size-8 items-center justify-center rounded-md transition-colors",
        active
          ? "bg-fg text-bg"
          : "text-fg-muted hover:bg-bg-alt hover:text-fg",
        disabled ? "cursor-not-allowed opacity-40 hover:bg-transparent" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}

// ─── Colour / highlight picker — tiny "popover" using <details> ──────────

function ColourSwatches({ editor, label }: { editor: Editor; label: string }) {
  return (
    <details className="relative">
      <summary
        title={label}
        aria-label={label}
        className="inline-flex size-8 cursor-pointer list-none items-center justify-center rounded-md text-fg-muted hover:bg-bg-alt hover:text-fg"
      >
        <span className="size-3 rounded-full border border-fg/40 bg-gradient-to-br from-red-500 via-amber-400 to-blue-500" />
      </summary>
      <div className="absolute left-0 top-full z-20 mt-1 flex gap-1 rounded-md border border-border bg-surface p-2 shadow-lg">
        {COLOURS.map((c) => (
          <button
            type="button"
            key={c.value || "default"}
            title={c.label}
            aria-label={`Color ${c.label}`}
            onClick={() => {
              if (c.value === "") editor.chain().focus().unsetColor().run();
              else editor.chain().focus().setColor(c.value).run();
              closeNearestDetails();
            }}
            className="size-6 rounded-full border border-border"
            style={{
              backgroundColor: c.value || "transparent",
              backgroundImage:
                c.value === ""
                  ? "linear-gradient(45deg, transparent 45%, currentColor 47%, currentColor 53%, transparent 55%)"
                  : undefined,
              color: "var(--fg-muted, #888)",
            }}
          />
        ))}
      </div>
    </details>
  );
}

function HighlightSwatches({
  editor,
  label,
}: {
  editor: Editor;
  label: string;
}) {
  return (
    <details className="relative">
      <summary
        title={label}
        aria-label={label}
        className="inline-flex size-8 cursor-pointer list-none items-center justify-center rounded-md text-fg-muted hover:bg-bg-alt hover:text-fg"
      >
        <Highlighter className="size-4" />
      </summary>
      <div className="absolute left-0 top-full z-20 mt-1 flex gap-1 rounded-md border border-border bg-surface p-2 shadow-lg">
        <button
          type="button"
          aria-label="Clear highlight"
          onClick={() => {
            editor.chain().focus().unsetHighlight().run();
            closeNearestDetails();
          }}
          className="size-6 rounded border border-border bg-surface text-fg-soft"
        >
          ×
        </button>
        {HIGHLIGHTS.map((h) => (
          <button
            type="button"
            key={h.value}
            title={h.label}
            aria-label={`Highlight ${h.label}`}
            onClick={() => {
              editor.chain().focus().toggleHighlight({ color: h.value }).run();
              closeNearestDetails();
            }}
            className="size-6 rounded border border-border"
            style={{ backgroundColor: h.value }}
          />
        ))}
      </div>
    </details>
  );
}

/** Click any swatch button → close the enclosing `<details>` popover. */
function closeNearestDetails() {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return;
  const details = active.closest("details");
  if (details) details.removeAttribute("open");
}
