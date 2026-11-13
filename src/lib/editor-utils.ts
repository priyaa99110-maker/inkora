import DOMPurify from "dompurify";

/** Detects whether stored content is already HTML (new editor) or legacy plain text. */
export function isHtmlContent(value: string): boolean {
  return /<\/?(p|h[1-6]|ul|ol|li|blockquote|hr|img|div|br|strong|em|s|u|span|pre)\b/i.test(value);
}

/** Escapes plain text and wraps each line in a paragraph so legacy entries render identically. */
export function plainTextToHtml(value: string): string {
  if (!value.trim()) return "";
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  return value
    .split(/\n{2,}/)
    .map((block) => `<p>${escape(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

/** Normalizes any stored content (legacy plain text or HTML) into safe HTML. */
export function toEditorHtml(value: string): string {
  const html = isHtmlContent(value) ? value : plainTextToHtml(value);
  return sanitizeHtml(html);
}

/** XSS-safe sanitization. Runs on the client; on the server we conservatively strip tags. */
export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html, {
    ALLOWED_URI_REGEXP: /^(?:https?|data:image\/(png|jpe?g|gif|webp);base64,|mailto:|#|\/)/i,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "srcdoc"],
  });
}

export function htmlToPlainText(html: string): string {
  if (!isHtmlContent(html)) return html;
  if (typeof window === "undefined") return html.replace(/<[^>]+>/g, " ");
  const el = document.createElement("div");
  el.innerHTML = sanitizeHtml(html);
  el.querySelectorAll("p,h1,h2,h3,h4,h5,h6,li,blockquote,br,hr").forEach((n) =>
    n.insertAdjacentText("beforebegin", "\n"),
  );
  return (el.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
}

export type EditorStats = {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  paragraphs: number;
  readingMinutes: number;
};

export function computeStats(text: string): EditorStats {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const paragraphs = trimmed ? trimmed.split(/\n{1,}/).filter((p) => p.trim().length > 0).length : 0;
  return {
    words,
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, "").length,
    paragraphs,
    readingMinutes: Math.max(words > 0 ? 1 : 0, Math.round(words / 200)),
  };
}