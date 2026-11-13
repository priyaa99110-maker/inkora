import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Highlighter,
  ImagePlus,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Palette,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InsertPopover } from "./insert-popover";
import {
  FONT_FAMILIES,
  FONT_SIZES,
  HIGHLIGHT_COLORS,
  LETTER_SPACINGS,
  LINE_SPACINGS,
  PARAGRAPH_SPACINGS,
  TEXT_COLORS,
} from "./editor-presets";

export type Typography = {
  letterSpacing: string;
  lineHeight: string;
  paragraphSpacing: string;
};

type Props = {
  editor: Editor;
  typography: Typography;
  onTypographyChange: (next: Typography) => void;
};

const HEADINGS = [1, 2, 3, 4, 5, 6] as const;

export function EditorToolbar({ editor, typography, onTypographyChange }: Props) {
  const btn = (active: boolean) => `toolbar-btn ${active ? "toolbar-btn-active" : ""}`;

  const insertImage = () => {
    const url = window.prompt("Image URL");
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      window.alert("Please use a full https:// image link.");
      return;
    }
    editor.chain().focus().setImage({ src: url, alt: "Journal image" }).run();
  };

  return (
    <div
      className="sticky top-0 z-20 mb-3 flex flex-wrap items-center gap-1 rounded-2xl border border-border/60 bg-card/80 p-2 backdrop-blur"
      role="toolbar"
      aria-label="Formatting toolbar"
    >
      <button type="button" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Bold" title="Bold">
        <Bold className="h-4 w-4" />
      </button>
      <button type="button" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Italic" title="Italic">
        <Italic className="h-4 w-4" />
      </button>
      <button type="button" className={btn(editor.isActive("underline"))} onClick={() => editor.chain().focus().toggleUnderline().run()} aria-label="Underline" title="Underline">
        <UnderlineIcon className="h-4 w-4" />
      </button>
      <button type="button" className={btn(editor.isActive("strike"))} onClick={() => editor.chain().focus().toggleStrike().run()} aria-label="Strikethrough" title="Strikethrough">
        <Strikethrough className="h-4 w-4" />
      </button>

      <span className="toolbar-sep" aria-hidden />

      <select
        aria-label="Paragraph style"
        className="toolbar-select"
        value={
          HEADINGS.find((level) => editor.isActive("heading", { level }))?.toString() ?? "p"
        }
        onChange={(e) => {
          const v = e.target.value;
          if (v === "p") editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level: Number(v) as 1 }).run();
        }}
      >
        <option value="p">Paragraph</option>
        {HEADINGS.map((level) => (
          <option key={level} value={level}>{`Heading ${level}`}</option>
        ))}
      </select>

      <select
        aria-label="Font family"
        className="toolbar-select"
        value={editor.getAttributes("textStyle").fontFamily ?? ""}
        onChange={(e) =>
          e.target.value
            ? editor.chain().focus().setFontFamily(e.target.value).run()
            : editor.chain().focus().unsetFontFamily().run()
        }
      >
        <option value="">Font</option>
        {FONT_FAMILIES.map((f) => (
          <option key={f.label} value={f.value}>{f.label}</option>
        ))}
      </select>

      <select
        aria-label="Font size"
        className="toolbar-select"
        value={editor.getAttributes("textStyle").fontSize ?? ""}
        onChange={(e) =>
          e.target.value
            ? editor.chain().focus().setFontSize(e.target.value).run()
            : editor.chain().focus().unsetFontSize().run()
        }
      >
        <option value="">Size</option>
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>{s.replace("px", "")}</option>
        ))}
      </select>

      <span className="toolbar-sep" aria-hidden />

      <ColorPopover
        icon={<Palette className="h-4 w-4" />}
        label="Text color"
        colors={TEXT_COLORS}
        onPick={(c) => editor.chain().focus().setColor(c).run()}
        onClear={() => editor.chain().focus().unsetColor().run()}
      />
      <ColorPopover
        icon={<Highlighter className="h-4 w-4" />}
        label="Highlight color"
        colors={HIGHLIGHT_COLORS}
        onPick={(c) => editor.chain().focus().setHighlight({ color: c }).run()}
        onClear={() => editor.chain().focus().unsetHighlight().run()}
      />

      <span className="toolbar-sep" aria-hidden />

      <button type="button" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Bullet list" title="Bullet list">
        <List className="h-4 w-4" />
      </button>
      <button type="button" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Numbered list" title="Numbered list">
        <ListOrdered className="h-4 w-4" />
      </button>
      <button type="button" className={btn(editor.isActive("taskList"))} onClick={() => editor.chain().focus().toggleTaskList().run()} aria-label="Checklist" title="Checklist">
        <ListChecks className="h-4 w-4" />
      </button>
      <button type="button" className={btn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()} aria-label="Quote" title="Quote">
        <Quote className="h-4 w-4" />
      </button>
      <button type="button" className="toolbar-btn" onClick={() => editor.chain().focus().setHorizontalRule().run()} aria-label="Divider" title="Divider">
        <Minus className="h-4 w-4" />
      </button>

      <span className="toolbar-sep" aria-hidden />

      {([
        ["left", AlignLeft],
        ["center", AlignCenter],
        ["right", AlignRight],
        ["justify", AlignJustify],
      ] as const).map(([align, Icon]) => (
        <button
          key={align}
          type="button"
          className={btn(editor.isActive({ textAlign: align }))}
          onClick={() => editor.chain().focus().setTextAlign(align).run()}
          aria-label={`Align ${align}`}
          title={`Align ${align}`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}

      <span className="toolbar-sep" aria-hidden />

      <InsertPopover onInsert={(value) => editor.chain().focus().insertContent(value).run()} />
      <button type="button" className="toolbar-btn" onClick={insertImage} aria-label="Insert image" title="Insert image">
        <ImagePlus className="h-4 w-4" />
      </button>

      <span className="toolbar-sep" aria-hidden />

      <select
        aria-label="Letter spacing"
        className="toolbar-select"
        value={typography.letterSpacing}
        onChange={(e) => onTypographyChange({ ...typography, letterSpacing: e.target.value })}
      >
        {LETTER_SPACINGS.map((o) => (
          <option key={o.value} value={o.value}>{`Letter: ${o.label}`}</option>
        ))}
      </select>
      <select
        aria-label="Line spacing"
        className="toolbar-select"
        value={typography.lineHeight}
        onChange={(e) => onTypographyChange({ ...typography, lineHeight: e.target.value })}
      >
        {LINE_SPACINGS.map((o) => (
          <option key={o.value} value={o.value}>{`Line: ${o.label}`}</option>
        ))}
      </select>
      <select
        aria-label="Paragraph spacing"
        className="toolbar-select"
        value={typography.paragraphSpacing}
        onChange={(e) => onTypographyChange({ ...typography, paragraphSpacing: e.target.value })}
      >
        {PARAGRAPH_SPACINGS.map((o) => (
          <option key={o.value} value={o.value}>{`Spacing: ${o.label}`}</option>
        ))}
      </select>

      <span className="toolbar-sep" aria-hidden />

      <button type="button" className="toolbar-btn" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} aria-label="Undo" title="Undo">
        <Undo2 className="h-4 w-4" />
      </button>
      <button type="button" className="toolbar-btn" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} aria-label="Redo" title="Redo">
        <Redo2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function ColorPopover({
  icon,
  label,
  colors,
  onPick,
  onClear,
}: {
  icon: React.ReactNode;
  label: string;
  colors: string[];
  onPick: (color: string) => void;
  onClear: () => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="toolbar-btn" aria-label={label} title={label}>
          {icon}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <p className="mb-2 text-xs text-muted-foreground">{label}</p>
        <div className="grid grid-cols-7 gap-1.5">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => onPick(c)}
              style={{ background: c }}
              className="h-6 w-6 rounded-full border border-border/70 transition hover:scale-110"
              aria-label={`${label} ${c}`}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="color"
            aria-label={`Custom ${label.toLowerCase()}`}
            className="h-8 w-10 cursor-pointer rounded-md border border-border/60 bg-transparent"
            onChange={(e) => onPick(e.target.value)}
          />
          <button onClick={onClear} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
            Clear
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}