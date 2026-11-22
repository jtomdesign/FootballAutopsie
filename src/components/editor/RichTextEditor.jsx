import React, { useCallback, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import CharacterCount from "@tiptap/extension-character-count";
import {
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiBold,
  RiItalic,
  RiUnderline,
  RiStrikethrough,
  RiH1,
  RiH2,
  RiH3,
  RiListUnordered,
  RiListOrdered,
  RiDoubleQuotesL,
  RiSeparator,
  RiLink,
  RiLinkUnlink,
  RiImageAddLine,
  RiAlignLeft,
  RiAlignCenter,
  RiAlignRight,
  RiTableLine,
  RiLoader4Line,
} from "react-icons/ri";
import { uploadPostImage } from "../../services/apiPosts";
import { toast } from "react-hot-toast";

const ToolbarButton = ({ onClick, active = false, title, children, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-40 ${
      active
        ? "bg-emerald-500 text-white"
        : "text-emerald-800 hover:bg-emerald-100"
    }`}
  >
    {children}
  </button>
);

const Divider = () => <span className="w-px h-6 bg-emerald-300 mx-1" />;

const RichTextEditor = ({
  content = "",
  onChange,
  placeholder = "Commencez à rédiger votre article…",
}) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { class: "editor-image" },
      }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      TableKit.configure({ table: { resizable: true } }),
      CharacterCount,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href;
    const url = window.prompt("URL du lien :", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const handleImageFile = useCallback(
    async e => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !editor) return;
      setUploading(true);
      try {
        const url = await uploadPostImage(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (err) {
        toast.error(err.message);
      } finally {
        setUploading(false);
      }
    },
    [editor],
  );

  if (!editor) return null;

  const words = editor.storage.characterCount?.words?.() ?? 0;

  return (
    <div className="border border-emerald-400/40 rounded-2xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-emerald-200 bg-emerald-50/60 sticky top-0 z-10">
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Annuler">
          <RiArrowGoBackLine />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Rétablir">
          <RiArrowGoForwardLine />
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Gras">
          <RiBold />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italique">
          <RiItalic />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Souligné">
          <RiUnderline />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Barré">
          <RiStrikethrough />
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Titre 1">
          <RiH1 />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Titre 2">
          <RiH2 />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Titre 3">
          <RiH3 />
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Liste à puces">
          <RiListUnordered />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Liste numérotée">
          <RiListOrdered />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Citation">
          <RiDoubleQuotesL />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Séparateur">
          <RiSeparator />
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Lien">
          <RiLink />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive("link")} title="Retirer le lien">
          <RiLinkUnlink />
        </ToolbarButton>
        <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Insérer une image" disabled={uploading}>
          {uploading ? <RiLoader4Line className="animate-spin" /> : <RiImageAddLine />}
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Aligner à gauche">
          <RiAlignLeft />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Centrer">
          <RiAlignCenter />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Aligner à droite">
          <RiAlignRight />
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insérer un tableau">
          <RiTableLine />
        </ToolbarButton>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFile}
      />

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="tiptap-editor min-h-[28rem] px-6 py-4 text-gray-900"
      />

      {/* Footer stats */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-emerald-200 bg-emerald-50/60 text-[0.7rem] text-emerald-800">
        <span>{words.toLocaleString("fr-FR")} mots</span>
        <span>{Math.max(1, Math.ceil(words / 200))} min de lecture</span>
      </div>
    </div>
  );
};

export default RichTextEditor;
