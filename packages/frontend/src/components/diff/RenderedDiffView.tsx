import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  computeMarkdownBlockDiff,
  type DiffBlock,
  type WordDiffPart,
} from "../../lib/markdownBlockDiff";

export interface RenderedDiffViewProps {
  fromContent: string;
  toContent: string;
  onParseError?: () => void;
}

function WordDiffSpans({ parts }: { parts: WordDiffPart[] }) {
  return (
    <div className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.added) {
          return (
            <ins
              key={i}
              className="bg-theme-success-bg text-theme-success-text no-underline rounded-sm px-0.5"
              data-diff-word="added"
            >
              {part.value}
            </ins>
          );
        }
        if (part.removed) {
          return (
            <del
              key={i}
              className="bg-theme-error-bg text-theme-error-text line-through rounded-sm px-0.5"
              data-diff-word="removed"
            >
              {part.value}
            </del>
          );
        }
        return <span key={i}>{part.value}</span>;
      })}
    </div>
  );
}

function BlockWrapper({
  block,
  children,
}: {
  block: DiffBlock;
  children: React.ReactNode;
}) {
  switch (block.status) {
    case "added":
      return (
        <div
          className="bg-theme-success-bg border-l-4 border-theme-success-border pl-3 rounded-r"
          data-diff-status="added"
          role="group"
          aria-label="Added block"
        >
          {children}
        </div>
      );
    case "removed":
      return (
        <div
          className="bg-theme-error-bg border-l-4 border-theme-error-border pl-3 rounded-r line-through opacity-75"
          data-diff-status="removed"
          role="group"
          aria-label="Removed block"
        >
          {children}
        </div>
      );
    case "modified":
      return (
        <div
          className="border-l-4 border-theme-warning-border pl-3 rounded-r"
          data-diff-status="modified"
          role="group"
          aria-label="Modified block"
        >
          {children}
        </div>
      );
    default:
      return (
        <div data-diff-status="unchanged" role="group" aria-label="Unchanged block">
          {children}
        </div>
      );
  }
}

function RenderBlock({ block }: { block: DiffBlock }) {
  return (
    <BlockWrapper block={block}>
      {block.status === "modified" && block.wordDiff ? (
        <WordDiffSpans parts={block.wordDiff} />
      ) : (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.markdown}</ReactMarkdown>
      )}
    </BlockWrapper>
  );
}

export function RenderedDiffView({
  fromContent,
  toContent,
  onParseError,
}: RenderedDiffViewProps) {
  const result = useMemo(() => {
    const r = computeMarkdownBlockDiff(fromContent, toContent);
    if (r.parseError) onParseError?.();
    return r;
  }, [fromContent, toContent, onParseError]);

  if (result.parseError) {
    return (
      <div
        className="p-4 text-sm text-theme-muted"
        data-testid="diff-view-parse-error"
      >
        <span className="inline-block px-2 py-0.5 mb-2 rounded text-xs bg-theme-warning-bg text-theme-warning-text">
          Markdown parsing failed
        </span>
        <p>Unable to render markdown diff. Please use raw mode.</p>
      </div>
    );
  }

  if (result.blocks.length === 0) {
    return (
      <div
        className="p-4 text-sm text-theme-muted"
        data-testid="diff-view-no-changes"
      >
        No changes
      </div>
    );
  }

  return (
    <div
      className="prose prose-sm max-w-none p-4 overflow-y-auto max-h-[24rem]"
      data-testid="diff-view-rendered"
    >
      {result.blocks.map((block, i) => (
        <RenderBlock key={i} block={block} />
      ))}
    </div>
  );
}
