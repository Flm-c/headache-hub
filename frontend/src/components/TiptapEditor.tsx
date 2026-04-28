import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';

// ─── Icons (simple SVG, no external dep) ─────────────────────────────────────

const BoldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
  </svg>
);

const ItalicIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="19" y1="4" x2="10" y2="4" />
    <line x1="14" y1="20" x2="5" y2="20" />
    <line x1="15" y1="4" x2="9" y2="20" />
  </svg>
);

const UnderlineIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M6 4v6a6 6 0 0 0 12 0V4" />
    <line x1="4" y1="20" x2="20" y2="20" />
  </svg>
);

const H1Icon = () => (
  <svg width="16" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M4 12h8M4 6v12M12 6v12M17 10l3-3v9" />
  </svg>
);

const H2Icon = () => (
  <svg width="16" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M4 12h8M4 6v12M12 6v12" />
    <path d="M16 14a2 2 0 0 1 4 0c0 1-1 2-4 4h4" />
  </svg>
);

const BulletListIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="9" y1="6" x2="20" y2="6" />
    <line x1="9" y1="12" x2="20" y2="12" />
    <line x1="9" y1="18" x2="20" y2="18" />
    <circle cx="5" cy="6" r="1" fill="currentColor" />
    <circle cx="5" cy="12" r="1" fill="currentColor" />
    <circle cx="5" cy="18" r="1" fill="currentColor" />
  </svg>
);

const BlockquoteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
  </svg>
);

const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

// ─── Toolbar button ───────────────────────────────────────────────────────────

const ToolbarBtn = ({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    title={title}
    className={`p-1.5 rounded transition-colors ${
      active
        ? 'bg-gray-800 text-white'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    {children}
  </button>
);

// ─── Main component ───────────────────────────────────────────────────────────

interface TiptapEditorProps {
  content?: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export default function TiptapEditor({
  content = '',
  onChange,
  placeholder = 'Start writing your article…',
  editable = true,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: {},
        orderedList: {},
        blockquote: {},
        codeBlock: { languageClassPrefix: 'language-' },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Typography,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    editable,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  const handleLinkToggle = () => {
    if (!editor) return;

    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    const url = window.prompt('Enter URL');
    if (!url) return;

    // Basic URL validation before setting
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      editor.chain().focus().setLink({ href: parsed.href }).run();
    } catch {
      // invalid URL — ignore
    }
  };

  if (!editor) return null;

  return (
    <div className="tiptap-wrapper relative min-h-[400px]">
      {/* Static toolbar — Telegraph-style, always visible while editing */}
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 pb-2 mb-4">
          <ToolbarBtn
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold (Ctrl+B)"
          >
            <BoldIcon />
          </ToolbarBtn>
          <ToolbarBtn
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic (Ctrl+I)"
          >
            <ItalicIcon />
          </ToolbarBtn>
          <ToolbarBtn
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon />
          </ToolbarBtn>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <ToolbarBtn
            active={editor.isActive('heading', { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Heading 1"
          >
            <H1Icon />
          </ToolbarBtn>
          <ToolbarBtn
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2"
          >
            <H2Icon />
          </ToolbarBtn>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <ToolbarBtn
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet list"
          >
            <BulletListIcon />
          </ToolbarBtn>
          <ToolbarBtn
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Blockquote"
          >
            <BlockquoteIcon />
          </ToolbarBtn>
          <ToolbarBtn
            active={editor.isActive('link')}
            onClick={handleLinkToggle}
            title="Link"
          >
            <LinkIcon />
          </ToolbarBtn>
        </div>
      )}

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="prose prose-gray max-w-none focus:outline-none"
      />
    </div>
  );
}
