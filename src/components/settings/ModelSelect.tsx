import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  findModelById,
  formatContextLength,
  getModelPricingLabels,
} from "@/lib/openRouterModelFormat";
import { cn } from "@/lib/utils";
import type { OpenRouterModel } from "@/types/aiSettings";

const VISIBLE_LIMIT = 10;

interface ModelSelectProps {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  models: OpenRouterModel[];
  hint?: string;
}

export function ModelSelect({
  label = "Modelo",
  value,
  onValueChange,
  models,
  hint,
}: ModelSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const options =
    models.length > 0
      ? models
      : [{ id: value, name: value, contextLength: null, pricing: null }];

  const selected = findModelById(options, value) ?? {
    id: value,
    name: value,
    contextLength: null,
    pricing: null,
  };
  const pricing = getModelPricingLabels(selected);

  const { visible, totalMatches } = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? options.filter(
          (model) =>
            model.name.toLowerCase().includes(normalized) ||
            model.id.toLowerCase().includes(normalized),
        )
      : options;

    return {
      visible: filtered.slice(0, VISIBLE_LIMIT),
      totalMatches: filtered.length,
    };
  }, [options, query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleSelect(modelId: string) {
    onValueChange(modelId);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="space-y-2" ref={rootRef}>
      <Label>{label}</Label>

      <div className="relative">
        <button
          type="button"
          className={cn(
            "flex w-full items-start justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm shadow-sm transition-colors",
            "hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500",
            "dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800",
          )}
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{selected.name || "Selecione um modelo"}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Entrada {pricing.input}/1M · Saída {pricing.output}/1M
            </p>
          </div>
          <ChevronDown
            className={cn("mt-1 h-4 w-4 shrink-0 opacity-50 transition-transform", open && "rotate-180")}
          />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-200 p-2 dark:border-slate-700">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Digite para filtrar modelos..."
                  className="pl-8"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && visible[0]) {
                      e.preventDefault();
                      handleSelect(visible[0].id);
                    }
                  }}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Mostrando {visible.length}
                {totalMatches > VISIBLE_LIMIT ? ` de ${totalMatches}` : ""} modelo
                {totalMatches === 1 ? "" : "s"}
                {!query.trim() ? " (digite para refinar)" : ""}
              </p>
            </div>

            <ul className="max-h-72 overflow-y-auto themed-scrollbar py-1" role="listbox">
              {visible.length === 0 ? (
                <li className="px-3 py-4 text-center text-sm text-slate-500">
                  Nenhum modelo encontrado
                </li>
              ) : (
                visible.map((model) => {
                  const labels = getModelPricingLabels(model);
                  const isActive = model.id === value;
                  return (
                    <li key={model.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        className={cn(
                          "flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm transition-colors",
                          isActive
                            ? "bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800",
                        )}
                        onClick={() => handleSelect(model.id)}
                      >
                        <span className="font-medium leading-snug">{model.name}</span>
                        <span className="truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {model.id}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Entrada {labels.input}/1M · Saída {labels.output}/1M
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900/50">
        <p className="font-medium text-slate-900 dark:text-slate-100">{selected.name}</p>
        <p className="mt-0.5 break-all font-mono text-xs text-slate-500 dark:text-slate-400">
          {selected.id}
        </p>
        <dl className="mt-3 grid gap-2 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Contexto
            </dt>
            <dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
              {formatContextLength(selected.contextLength)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Entrada
            </dt>
            <dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
              {pricing.input}
              <span className="ml-1 text-xs font-normal text-slate-500">/ 1M tokens</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Saída
            </dt>
            <dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
              {pricing.output}
              <span className="ml-1 text-xs font-normal text-slate-500">/ 1M tokens</span>
            </dd>
          </div>
        </dl>
      </div>

      {hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}
