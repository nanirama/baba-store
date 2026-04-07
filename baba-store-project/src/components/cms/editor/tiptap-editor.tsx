"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

type TipTapEditorProps = {
  value: string;
  onChange: (json: string) => void;
};

export function TipTapEditor({ value, onChange }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4, 5, 6] },
      }),
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: value ? JSON.parse(value) : { type: "doc", content: [] },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "tiptap-content min-h-[220px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none",
      },
    },
    onUpdate({ editor: currentEditor }) {
      onChange(JSON.stringify(currentEditor.getJSON()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = JSON.stringify(editor.getJSON());
    if (value && current !== value) {
      editor.commands.setContent(JSON.parse(value), { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return <div className="h-[220px] animate-pulse rounded-md border border-input bg-muted" />;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`px-2 py-1 text-xs border rounded ${editor.isActive("paragraph") ? "bg-black text-white" : ""}`}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          Paragraph
        </button>
        <button
          type="button"
          className={`px-2 py-1 text-xs border rounded ${editor.isActive("bold") ? "bg-black text-white" : ""}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          type="button"
          className={`px-2 py-1 text-xs border rounded ${editor.isActive("italic") ? "bg-black text-white" : ""}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
        <button
          type="button"
          className={`px-2 py-1 text-xs border rounded ${editor.isActive("heading", { level: 2 }) ? "bg-black text-white" : ""}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </button>
        <button
          type="button"
          className={`px-2 py-1 text-xs border rounded ${editor.isActive("heading", { level: 3 }) ? "bg-black text-white" : ""}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </button>
        <button
          type="button"
          className={`px-2 py-1 text-xs border rounded ${editor.isActive("heading", { level: 4 }) ? "bg-black text-white" : ""}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        >
          H4
        </button>
        <button
          type="button"
          className={`px-2 py-1 text-xs border rounded ${editor.isActive("heading", { level: 5 }) ? "bg-black text-white" : ""}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
        >
          H5
        </button>
        <button
          type="button"
          className={`px-2 py-1 text-xs border rounded ${editor.isActive("heading", { level: 6 }) ? "bg-black text-white" : ""}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
        >
          H6
        </button>
        <button
          type="button"
          className={`px-2 py-1 text-xs border rounded ${editor.isActive("orderedList") ? "bg-black text-white" : ""}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          Ordered List
        </button>
        <button
          type="button"
          className={`px-2 py-1 text-xs border rounded ${editor.isActive("bulletList") ? "bg-black text-white" : ""}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          Unordered List
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
