import sanitizeHtml from "sanitize-html";

type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
  content?: TipTapNode[];
};

type TipTapDoc = {
  type: "doc";
  content: TipTapNode[];
};

function textNode(text: string): TipTapNode {
  return { type: "text", text };
}

function parseInline(text: string): TipTapNode[] {
  if (!text.trim()) return [];

  const chunks = text.split(/(<a [^>]*>.*?<\/a>)/gi).filter(Boolean);
  return chunks.flatMap((chunk) => {
    const anchorMatch = chunk.match(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/i);
    if (!anchorMatch) {
      const plain = chunk.replace(/<[^>]+>/g, "").trim();
      return plain ? [textNode(plain)] : [];
    }

    const href = anchorMatch[1];
    const label = anchorMatch[2]?.replace(/<[^>]+>/g, "").trim() ?? href;
    return [
      {
        type: "text",
        text: label,
        marks: [{ type: "link", attrs: { href } }],
      },
    ];
  });
}

/** True if string looks like HTML/entities (Georgian plain text stays false). */
function looksLikeHtml(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (/<[a-zA-Z][\s\S]*?>/.test(t)) return true;
  if (/&(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z]{2,});/.test(t)) return true;
  return false;
}

function decodeBasicEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)));
}

/** Strip tags for fallback when block parser finds nothing (keeps Unicode text). */
function htmlToPlainTextFallback(html: string): string {
  return decodeBasicEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  ).trim();
}

/**
 * Plain text / Georgian → TipTap doc (one or more paragraphs). Preserves all Unicode.
 * Double newlines → separate paragraphs; single newlines stay inside one paragraph.
 */
export function plainTextToTipTapDoc(text: string): TipTapDoc {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return { type: "doc", content: [{ type: "paragraph", content: [textNode("")] }] };
  }

  const parts = normalized.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const blocks = parts.length > 0 ? parts : [normalized];

  return {
    type: "doc",
    content: blocks.flatMap((block) => {
      const lines = block.split("\n").map((l) => l.trimEnd());
      if (lines.length <= 1) {
        return [{ type: "paragraph", content: [textNode(block)] }];
      }
      return lines.map((line) => ({
        type: "paragraph",
        content: [textNode(line)],
      }));
    }),
  };
}

function parseHtmlBlocksToTipTap(safeHtml: string): TipTapNode[] {
  const blocks = safeHtml.split(/(?=<h[1-6]|<p|<ul|<ol|<img|<div)/gi).filter(Boolean);
  const content: TipTapNode[] = [];

  for (const block of blocks) {
    const headingMatch = block.match(/<(h[1-6])[^>]*>([\s\S]*?)<\/h[1-6]>/i);
    if (headingMatch) {
      const level = Number(headingMatch[1].slice(1));
      content.push({
        type: "heading",
        attrs: { level },
        content: parseInline(headingMatch[2]),
      });
      continue;
    }

    const paragraphMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    if (paragraphMatch) {
      content.push({ type: "paragraph", content: parseInline(paragraphMatch[1]) });
      continue;
    }

    const divMatch = block.match(/<div[^>]*>([\s\S]*?)<\/div>/i);
    if (divMatch) {
      content.push({ type: "paragraph", content: parseInline(divMatch[1]) });
      continue;
    }

    const listMatch = block.match(/<(ul|ol)[^>]*>([\s\S]*?)<\/(ul|ol)>/i);
    if (listMatch) {
      const listType = listMatch[1].toLowerCase() === "ol" ? "orderedList" : "bulletList";
      const items = [...listMatch[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
      content.push({
        type: listType,
        content: items.map((item) => ({
          type: "listItem",
          content: [{ type: "paragraph", content: parseInline(item[1]) }],
        })),
      });
      continue;
    }

    const imageMatch = block.match(/<img [^>]*src="([^"]+)"[^>]*>/i);
    if (imageMatch) {
      content.push({
        type: "image",
        attrs: {
          src: imageMatch[1],
          alt: (block.match(/alt="([^"]*)"/i)?.[1] ?? "").trim(),
        },
      });
    }
  }

  return content;
}

/**
 * Convert spreadsheet / CMS HTML or plain text to TipTap JSON.
 * - Plain text (e.g. Georgian with no tags): one or more `paragraph` nodes, Unicode preserved.
 * - HTML: sanitized then parsed; if no blocks match, fall back to stripped text as paragraphs.
 */
export function htmlToTipTapJson(rawHtml: string): TipTapDoc {
  const trimmed = String(rawHtml ?? "").trim();
  if (!trimmed) {
    return { type: "doc", content: [{ type: "paragraph", content: [textNode("")] }] };
  }

  if (!looksLikeHtml(trimmed)) {
    return plainTextToTipTapDoc(trimmed);
  }

  const safeHtml = sanitizeHtml(trimmed, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "div",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "strong",
      "em",
      "b",
      "i",
      "br",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });

  const content = parseHtmlBlocksToTipTap(safeHtml);

  if (content.length > 0) {
    return { type: "doc", content };
  }

  const fallback = htmlToPlainTextFallback(safeHtml);
  if (fallback) {
    return plainTextToTipTapDoc(fallback);
  }

  return { type: "doc", content: [{ type: "paragraph", content: [textNode("")] }] };
}
