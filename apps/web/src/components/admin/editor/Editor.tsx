"use client";

import { useEditor, EditorContent, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { useEffect, useRef } from "react";
import { Toolbar } from "./Toolbar";
import { sanitizeHtml } from "@/lib/admin/sanitize";
import { uploadImageFile } from "./uploadImage";

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

  // Editor reference for use inside the drop/paste handlers — they run
  // before `useEditor` returns, but their closures fire async on user
  // interaction, by which time the ref has been populated.
  const editorRef = useRef<TiptapEditor | null>(null);

  // Insert an image at a position. Optimistically inserts a placeholder
  // (a known data URL via the Image extension's allowBase64 path) so
  // the editor sees something immediately, then swaps src after the
  // real upload completes. On failure removes the placeholder.
  async function insertImageAtPosition(
    file: File,
    pos: number | null,
  ): Promise<void> {
    const ed = editorRef.current;
    if (!ed) return;

    // 1×1 transparent placeholder. Cheap, parseable as a real image by
    // the browser so the editor lays out a block.
    const PLACEHOLDER =
      "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
    const marker = `pending-${crypto.randomUUID()}`;

    const insertCmd = ed
      .chain()
      .focus()
      .insertContentAt(pos ?? ed.state.selection.from, {
        type: "image",
        attrs: {
          src: PLACEHOLDER,
          alt: `Uploading ${file.name}…`,
          title: marker, // we use this to find the node on success/failure
        },
      });
    insertCmd.run();

    const result = await uploadImageFile(file);

    // Find the node we inserted (it may have moved if the editor was
    // typed into during upload). Walk the doc looking for our marker.
    const findPos = (): number | null => {
      let found: number | null = null;
      ed.state.doc.descendants((node, p) => {
        if (node.type.name === "image" && node.attrs.title === marker) {
          found = p;
          return false;
        }
        return true;
      });
      return found;
    };

    const targetPos = findPos();
    if (targetPos === null) return; // node was deleted during upload

    if (!result.ok) {
      // Remove the placeholder + show a non-blocking message via the
      // browser's prompt-less alert path. Phase B could replace this
      // with a toast.
      ed.chain()
        .focus()
        .deleteRange({ from: targetPos, to: targetPos + 1 })
        .run();
      console.warn(`[editor] image upload failed (${result.code}):`, result.message);
      return;
    }

    // Replace the placeholder node in-place with the real URL.
    ed.chain()
      .focus()
      .setNodeSelection(targetPos)
      .updateAttributes("image", {
        src: result.url,
        alt: file.name.replace(/\.[a-z0-9]+$/i, ""),
        title: null,
      })
      .run();
  }

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
        // Add "image" so users can centre / right-align an image. The
        // Image extension renders as a block node and accepts the
        // textAlign attribute via the same wrapper that handles
        // headings and paragraphs.
        types: ["heading", "paragraph", "image"],
        defaultAlignment: "left",
      }),
      Image.configure({
        inline: false,
        // We never want the raw HTML allowlist to permit a fresh `<img>`
        // an editor might paste before upload finishes. ProseMirror's
        // schema still permits `<img>` (we transform pasted data: URLs
        // → real uploads in handlePaste below) but renders go through
        // the sanitiser anyway as defense-in-depth.
        allowBase64: true,
        HTMLAttributes: {
          class: "tiptap-image",
          loading: "lazy",
        },
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
      // Sanitise pastes before ProseMirror parses them. TipTap calls this
      // hook with the raw clipboard HTML (e.g. WeChat or Word output);
      // we strip everything that's not in the allowlist before the
      // schema gets a crack at it. Plain-text pastes go through
      // `transformPastedText` (unused here — TipTap turns text into
      // paragraphs natively, no sanitising needed for text).
      transformPastedHTML: (html) => sanitizeHtml(html),
      // Drag-drop a file from Finder/Explorer onto the editor.
      handleDrop(view, event, _slice, moved) {
        if (moved) return false; // internal node drag, let TipTap handle
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) =>
          f.type.startsWith("image/"),
        );
        if (files.length === 0) return false;
        event.preventDefault();
        const coords = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });
        const pos = coords?.pos ?? view.state.selection.from;
        for (const file of files) {
          void insertImageAtPosition(file, pos);
        }
        return true;
      },
      // Cmd-V on a clipboard image (screenshot / copied-from-Photos).
      // TipTap doesn't ship a built-in for this; we look for image
      // files on the clipboardData.
      handlePaste(_view, event) {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) =>
          f.type.startsWith("image/"),
        );
        if (files.length === 0) return false;
        event.preventDefault();
        for (const file of files) {
          void insertImageAtPosition(file, null);
        }
        return true;
      },
    },
  });

  // Mirror the editor instance into a ref so the drop / paste handlers
  // (closures captured at useEditor config time) can reach it.
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

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
      <Toolbar
        editor={editor}
        labels={toolbarLabels}
        onUploadImage={(file) => insertImageAtPosition(file, null)}
      />
      <EditorContent editor={editor} />
    </div>
  );
}

export type EditorInstance = TiptapEditor;
