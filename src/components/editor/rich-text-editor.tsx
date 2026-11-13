import { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Color, FontFamily, FontSize, TextStyle } from "@tiptap/extension-text-style";
import { EditorToolbar, type Typography } from "./editor-toolbar";
import { EditorStatsBar } from "./editor-stats";
import { AiAssistant } from "./ai-assistant";
import { computeStats, sanitizeHtml, toEditorHtml } from "@/lib/editor-utils";

const TYPOGRAPHY_KEY = "pihu:editor-typography";

const DEFAULT_TYPOGRAPHY: Typography = {
  letterSpacing: "0em",
  lineHeight: "1.8",
  paragraphSpacing: "0.9em",
};

type Props = {
  /** Stored entry content (legacy plain text or HTML). */
  value: string;
  /** Called with sanitized HTML on every change. */
  onChange: (html: string) => void;
  /** Key that changes when a different entry is opened. */
  entryId: string;
  lastEdited?: string | null;
  placeholder?: string;
};

export function RichTextEditor({ value, onChange, entryId, lastEdited, placeholder }: Props) {
  const [typography, setTypography] = useState<Typography>(DEFAULT_TYPOGRAPHY);
  const [plainText, setPlainText] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(TYPOGRAPHY_KEY);
      if (stored) setTypography({ ...DEFAULT_TYPOGRAPHY, ...JSON.parse(stored) });
    } catch {
      /* ignore malformed preferences */
    }
  }, []);

  const updateTypography = (next: Typography) => {
    setTypography(next);
    try {
      localStorage.setItem(TYPOGRAPHY_KEY, JSON.stringify(next));
    } catch {
      /* storage may be unavailable */
    }
  };

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
        TaskList,
        TaskItem.configure({ nested: true }),
        TextStyle,
        Color,
        FontFamily,
        FontSize,
        Highlight.configure({ multicolor: true }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Image.configure({ inline: false, allowBase64: true }),
        Placeholder.configure({ placeholder: placeholder ?? "Dear diary…" }),
      ],
      content: toEditorHtml(value ?? ""),
      editorProps: {
        attributes: {
          class: "journal-prose focus:outline-none",
          "aria-label": "Journal entry content",
        },
      },
      onUpdate: ({ editor: e }) => {
        onChange(sanitizeHtml(e.getHTML()));
        setPlainText(e.getText());
      },
    },
    [entryId],
  );

  useEffect(() => {
    if (editor) setPlainText(editor.getText());
  }, [editor]);

  const stats = useMemo(() => computeStats(plainText), [plainText]);

  if (!editor) {
    return <div className="mt-4 h-[380px] animate-pulse rounded-2xl bg-muted/40" aria-hidden />;
  }

  return (
    <div className="mt-4">
      <EditorToolbar editor={editor} typography={typography} onTypographyChange={updateTypography} />
      <div
        className="journal-surface rounded-2xl border border-border/50 bg-background/40 p-4"
        style={
          {
            "--journal-letter-spacing": typography.letterSpacing,
            "--journal-line-height": typography.lineHeight,
            "--journal-paragraph-spacing": typography.paragraphSpacing,
          } as React.CSSProperties
        }
      >
        <EditorContent editor={editor} />
      </div>
      <EditorStatsBar stats={stats} lastEdited={lastEdited} />
      <AiAssistant
        getText={() => editor.getText()}
        onApply={(text) => {
          const html = text
            .split(/\n{2,}/)
            .map((block) => `<p>${block.replace(/\n/g, "<br />")}</p>`)
            .join("");
          editor.chain().focus().setContent(sanitizeHtml(html)).run();
          onChange(sanitizeHtml(editor.getHTML()));
          setPlainText(editor.getText());
        }}
      />
    </div>
  );
}