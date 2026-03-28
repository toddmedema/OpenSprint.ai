import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

export interface MarkdownChatBubbleProps {
  content: string;
}

/**
 * Renders markdown content inside agent chat reply bubbles with GFM support
 * and XSS sanitization. Wraps ReactMarkdown so all chat panels share one
 * config for rendering + sanitization.
 */
export function MarkdownChatBubble({ content }: MarkdownChatBubbleProps) {
  return (
    <div className="prose-chat-bubble">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
