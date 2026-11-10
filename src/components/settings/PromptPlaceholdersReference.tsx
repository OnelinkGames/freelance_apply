import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyPlaceholderToken, PROMPT_PLACEHOLDERS } from "@/lib/promptPlaceholders";

interface PromptPlaceholdersReferenceProps {
  compact?: boolean;
}

export function PromptPlaceholdersReference({ compact = false }: PromptPlaceholdersReferenceProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
      <div className="border-b border-slate-200 px-3 py-2 dark:border-slate-700">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          Placeholders — origem no Kanban
        </p>
        {!compact && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Substituídos automaticamente ao enviar o prompt para a IA, com dados do projeto aberto.
          </p>
        )}
      </div>
      <ul className="divide-y divide-slate-200 dark:divide-slate-700">
        {PROMPT_PLACEHOLDERS.map((item) => (
          <li key={item.key} className="px-3 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-blue-700 dark:bg-slate-950 dark:text-blue-300">
                    {item.token}
                  </code>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    {item.label}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{item.column}</span>
                  {" → "}
                  {item.fields.join(" · ")}
                </p>
                {!compact && (
                  <>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      <span className="font-medium">Exemplo:</span>{" "}
                      <span className="whitespace-pre-wrap italic">{item.example}</span>
                    </p>
                  </>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                title="Copiar placeholder"
                onClick={() => copyPlaceholderToken(item.token)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
