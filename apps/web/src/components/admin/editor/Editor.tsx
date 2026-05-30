"use client";

import { useEditor, EditorContent, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef } from "react";
import { Toolbar } from "./Toolbar";

interface Props {
  /** Initial HTML to load. Subsequent updates to this prop reset the editor
   *  (e.g. switching translation tabs) via `key={locale}` upstream. */
  initialHTML: string;
  /** Fired whenever the document changes — receives the latest HTML string.
   *  Caller is responsible for debouncing if it triggers network calls. */
  onChange: (html: string) => void;
  placeholder?: string;
  /** Disable the editor (e.g. while saving). */
  disabled?: boolean;
  /** Forwarded to the toolbar so labels match the surrounding admin UI. */
  toolbarLabels: Parameters<typeof Toolbar>[0]["labels"];
}

export function Editor({
  initialHTML,
  onChange,
  placeholder,
  disabled,
  toolbarLabels,
}: Props) {
  // useRef holds the latest onChange so we don't have to add it to the
  // extensions array (which would re-init the editor on every render and
  // wipe selection state).
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      // StarterKit v3 ships Bold / Italic / Strike / Underline / Heading
      // (1-6) / BulletList / OrderedList / ListItem / Code / CodeBlock /
      // Blockquote / HorizontalRule / HardBreak / Link / Paragraph /
      // History / Document / Text.
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            rel: "noopener noreferrer",
            target: "_blank",
          },
        },
        codeBlock: {
          HTMLAttributes: { class: "tiptap-codeblock" },
        },
        blockquote: {
          HTMLAttributes: { class: "tiptap-blockquote" },
        },
      }),
      TextStyle, // required for Color
      Color.configure({ types: ["textStyle"] }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        defaultAlignment: "left",
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "",
        emptyEditorClass:
          "is-editor-empty before:content-[attr(data-placeholder)] before:text-fg-soft before:float-left before:h-0 before:pointer-events-none",
      }),
    ],
    content: initialHTML,
    editable: !disabled,
    immediatelyRender: false, // Next.js SSR: render on the client only
    onUpdate: ({ editor }) => {
      onChangeRef.current(editor.getHTML());
    },
    editorProps: {
      attributes: {
        // `prose` brings @tailwindcss/typography styles when installed;
        // we additionally apply our own admin-editor classes below so the
        // editor looks similar to the public article page.
        class:
          "tiptap-editor max-w-none focus:outline-none min-h-[28rem] px-4 py-3",
      },
    },
  });

  // When `disabled` flips externally we tell the editor to match.
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  // When `initialHTML` changes externally (e.g. parent loaded new data
  // after a save), reset the editor content without firing onChange.
  // The component-upstream uses `key={locale}` to fully reset on tab
  // switch; this effect handles in-place re-loads only.
  const lastInitialRef = useRef(initialHTML);
  useEffect(() => {
    if (!editor) return;
    if (initialHTML === lastInitialRef.current) return;
    lastInitialRef.current = initialHTML;
    editor.commands.setContent(initialHTML, { emitUpdate: false });
  }, [editor, initialHTML]);

  return (
    <div className="rounded-md border border-border bg-surface focus-within:border-fg/40">
      <Toolbar editor={editor} labels={toolbarLabels} />
      <EditorContent editor={editor} />
    </div>
  );
}

export type EditorInstance = TiptapEditor;
