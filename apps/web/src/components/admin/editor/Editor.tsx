"use client";

import { useEditor, EditorContent, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { useEffect, useRef, useState } from "react";
import { Toolbar } from "./Toolbar";
import { sanitizeHtml } from "@/lib/admin/sanitize";
import { uploadImageFile } from "./uploadImage";
import { useToasts, ToastView } from "../Toast";
import { ImageCropDialog, type ImageCropDialogLabels } from "./ImageCropDialog";

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
  /** Labels for the crop-image dialog shown before each upload. */
  cropDialogLabels: ImageCropDialogLabels;
}

export function Editor({
  initialHTML,
  onChange,
  placeholder,
  disabled,
  toolbarLabels,
  cropDialogLabels,
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

  // Local toast stack — image-upload failures surface here instead of
  // a blocking window.alert(). Scoped to this Editor instance.
  const { toasts, push: pushToast, dismiss: dismissToast } = useToasts();

  // Crop dialog state. When `cropFile` is non-null the modal is open;
  // `cropResolverRef` holds the resolver from the promise that
  // `openCropDialog` returned, so the modal's callbacks can fulfil it.
  const [cropFile, setCropFile] = useState<File | null>(null);
  const cropResolverRef = useRef<((file: File | null) => void) | null>(null);

  /** Opens the crop dialog on `file` and resolves with the file the
   *  user picked (cropped or original), or null if they cancelled. */
  function openCropDialog(file: File): Promise<File | null> {
    return new Promise<File | null>((resolve) => {
      cropResolverRef.current = resolve;
      setCropFile(file);
    });
  }

  function resolveCrop(result: File | null): void {
    const resolver = cropResolverRef.current;
    cropResolverRef.current = null;
    setCropFile(null);
    resolver?.(result);
  }

  async function insertImageAtPosition(
    file: File,
    pos: number | null,
  ): Promise<void> {
    const ed = editorRef.current;
    if (!ed) return;

    // Step 1 — let the editor crop (or skip) before we upload. SVG /
    // GIF go straight through because the canvas-based crop can't
    // round-trip them losslessly; in practice we lose animation /
    // vector content otherwise.
    const skipCrop = file.type === "image/svg+xml" || file.type === "image/gif";
    const finalFile = skipCrop ? file : await openCropDialog(file);
    if (!finalFile) return; // cancelled

    // Step 2 — upload. Show a sticky in-flight toast so a slow upload
    // doesn't feel like the app lost the drop.
    const uploadingToastId = pushToast(
      "info",
      "Uploading image…",
      finalFile.name,
      { sticky: true },
    );

    const result = await uploadImageFile(finalFile);

    // Dismiss the in-flight toast either way.
    dismissToast(uploadingToastId);

    if (!result.ok) {
      const title = "Image upload failed";
      const description = `${result.code}${result.message ? `: ${result.message}` : ""}`;
      console.error("[editor]", title, description);
      pushToast("error", title, description);
      return;
    }

    // Insert the real image at the requested position (or current
    // selection if drop position is unknown / paste).
    ed.chain()
      .focus()
      .insertContentAt(pos ?? ed.state.selection.from, {
        type: "image",
        attrs: {
          src: result.url,
          alt: finalFile.name.replace(/\.[a-z0-9]+$/i, ""),
        },
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
        HTMLAttributes: {
          class: "tiptap-image",
          loading: "lazy",
        },
        // Equal-proportion corner drag — same shape WeChat editor uses.
        // 4 diagonal handles only (no top/right/bottom/left mid-edges
        // because aspect ratio is locked; mid-edges would constrain one
        // axis and feel broken). Aspect ratio always preserved so an
        // editor can't accidentally squash an image.
        resize: {
          enabled: true,
          directions: ["top-left", "top-right", "bottom-left", "bottom-right"],
          minWidth: 64,
          minHeight: 64,
          alwaysPreserveAspectRatio: true,
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
      // Dragover must preventDefault for the drop to actually fire; the
      // browser's default reaction to a dropped file is to navigate to
      // it. ProseMirror handles this for some events but not reliably
      // for cross-origin file drops in every browser; this hook makes it
      // explicit. We only intercept when the drag carries files (text
      // drag-and-drop inside the editor still works normally).
      handleDOMEvents: {
        dragover: (_view, event) => {
          if (event.dataTransfer?.types?.includes("Files")) {
            event.preventDefault();
          }
          return false;
        },
      },
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
    <>
      <div className="rounded-md border border-border bg-surface focus-within:border-fg/40">
        <Toolbar
          editor={editor}
          labels={toolbarLabels}
          onUploadImage={(file) => insertImageAtPosition(file, null)}
        />
        <EditorContent editor={editor} />
      </div>
      <ToastView toasts={toasts} dismiss={dismissToast} />
      <ImageCropDialog
        file={cropFile}
        labels={cropDialogLabels}
        onResolve={resolveCrop}
      />
    </>
  );
}

export type EditorInstance = TiptapEditor;
