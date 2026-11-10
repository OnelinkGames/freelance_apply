import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900",
        className,
      )}
    >
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="markdown-preview break-words pr-2 text-sm [overflow-wrap:anywhere]">
          {content ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            <p className="text-slate-400">Nenhum conteúdo gerado ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
