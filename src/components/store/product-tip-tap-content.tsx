import Image from "next/image";
import type { ReactNode } from "react";

import type { ProductDescriptionJson } from "@/types/cms";

type TipTapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

type TipTapNode = {
  type: string;
  text?: string;
  marks?: TipTapMark[];
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
};

function renderTextWithMarks(text: string, marks?: TipTapMark[]): ReactNode {
  let output: ReactNode = text;

  for (const mark of marks ?? []) {
    if (mark.type === "bold") {
      output = <strong>{output}</strong>;
      continue;
    }
    if (mark.type === "italic") {
      output = <em>{output}</em>;
      continue;
    }
    if (mark.type === "link") {
      const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "#";
      output = (
        <a href={href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
          {output}
        </a>
      );
    }
  }

  return output;
}

function renderNodes(nodes: TipTapNode[] = []): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${node.type}-${index}`;

    if (node.type === "text") {
      return <span key={key}>{renderTextWithMarks(node.text ?? "", node.marks)}</span>;
    }

    if (node.type === "hardBreak") {
      return <br key={key} />;
    }

    if (node.type === "paragraph") {
      return (
        <p key={key} className="text-[15px] leading-7 text-pretty text-neutral-800">
          {renderNodes(node.content)}
        </p>
      );
    }

    if (node.type === "heading") {
      const level = Number(node.attrs?.level ?? 2);
      const className = "font-semibold text-neutral-900 mt-4 mb-2 first:mt-0 break-words";
      if (level === 2) return <h2 key={key} className={`text-xl ${className}`}>{renderNodes(node.content)}</h2>;
      if (level === 3) return <h3 key={key} className={`text-lg ${className}`}>{renderNodes(node.content)}</h3>;
      if (level === 4) return <h4 key={key} className={`text-base ${className}`}>{renderNodes(node.content)}</h4>;
      if (level === 5) return <h5 key={key} className={`text-sm ${className}`}>{renderNodes(node.content)}</h5>;
      return <h6 key={key} className={`text-sm ${className}`}>{renderNodes(node.content)}</h6>;
    }

    if (node.type === "bulletList") {
      return (
        <ul
          key={key}
          className="list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-neutral-800 marker:text-neutral-900"
        >
          {renderNodes(node.content)}
        </ul>
      );
    }

    if (node.type === "orderedList") {
      return (
        <ol key={key} className="list-decimal space-y-1.5 pl-5 text-[15px] leading-7 text-neutral-800">
          {renderNodes(node.content)}
        </ol>
      );
    }

    if (node.type === "listItem") {
      return (
        <li key={key} className="break-words [&_p]:mb-1 [&_p:last-child]:mb-0">
          {renderNodes(node.content)}
        </li>
      );
    }

    if (node.type === "image") {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
      if (!src) return null;
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      return (
        <Image
          key={key}
          src={src}
          alt={alt || "პროდუქტის სურათი"}
          width={1280}
          height={720}
          sizes="(min-width: 1024px) 480px, 100vw"
          className="my-4 h-auto max-h-[min(80vh,720px)] w-full max-w-full rounded-lg border border-neutral-200 object-contain"
        />
      );
    }

    return null;
  });
}

export function ProductTipTapContent({ description }: { description: ProductDescriptionJson | null }) {
  const nodes = (description?.content as TipTapNode[] | undefined) ?? [];
  if (nodes.length === 0) return null;

  return (
    <div className="product-prose w-full min-w-0 max-w-none space-y-3 break-words [&_a]:break-words">
      {renderNodes(nodes)}
    </div>
  );
}
