import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeSelector } from "@/components/theme/ThemeSelector";
import { formatBRL, formatDateBR, formatDateShort } from "@/lib/currency";
import { getCostDashboard, getCostHistory } from "@/services/costs/costService";
import { PROCESS_LABELS, type AICostRecord, type CostDashboard } from "@/types/costs";

interface CostsPageProps {
  onBack: () => void;
}

function BarChart({
  items,
  labelKey,
  valueKey,
  formatLabel,
}: {
  items: Record<string, unknown>[];
  labelKey: string;
  valueKey: string;
  formatLabel?: (item: Record<string, unknown>) => string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">Sem dados ainda.</p>;
  }

  const max = Math.max(...items.map((i) => Number(i[valueKey]) || 0), 0.000001);

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const value = Number(item[valueKey]) || 0;
        const label = formatLabel ? formatLabel(item) : String(item[labelKey]);
        const width = Math.max((value / max) * 100, value > 0 ? 2 : 0);

        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="truncate pr-2 text-slate-600 dark:text-slate-400">{label}</span>
              <span className="shrink-0 font-medium">{formatBRL(value)}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export function CostsPage({ onBack }: CostsPageProps) {
  const [dashboard, setDashboard] = useState<CostDashboard | null>(null);
  const [history, setHistory] = useState<AICostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getCostDashboard(), getCostHistory(100)])
      .then(([dash, hist]) => {
        setDashboard(dash);
        setHistory(hist);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar custos"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error ?? "Erro desconhecido"}</p>
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Custos de IA</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Acompanhamento de gastos com integrações de IA</p>
            </div>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          <StatCard label="Custo total" value={formatBRL(dashboard.totalCost)} />
          <StatCard label="Mês atual" value={formatBRL(dashboard.monthCost)} />
          <StatCard label="Hoje" value={formatBRL(dashboard.dayCost)} />
          <StatCard label="Chamadas" value={String(dashboard.totalCalls)} />
          <StatCard label="Tokens" value={dashboard.totalTokens.toLocaleString("pt-BR")} />
          <StatCard label="Média / projeto" value={formatBRL(dashboard.avgCostPerProject)} />
          <StatCard label="Média / documento" value={formatBRL(dashboard.avgCostPerDocument)} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gasto por etapa</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                items={dashboard.byProcess.filter((p) => p.cost > 0) as unknown as Record<string, unknown>[]}
                labelKey="label"
                valueKey="cost"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gastos por dia</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                items={dashboard.byDay as unknown as Record<string, unknown>[]}
                labelKey="date"
                valueKey="cost"
                formatLabel={(item) => formatDateShort(String(item.date))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gastos por projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                items={dashboard.byProject as unknown as Record<string, unknown>[]}
                labelKey="projectName"
                valueKey="cost"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gastos por modelo</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                items={dashboard.byModel as unknown as Record<string, unknown>[]}
                labelKey="model"
                valueKey="cost"
              />
            </CardContent>
          </Card>
        </div>

        {dashboard.projectProfit.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lucro líquido por projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto themed-scrollbar themed-scrollbar-x">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-500 dark:text-slate-400">
                      <th className="pb-2 pr-4">Projeto</th>
                      <th className="pb-2 pr-4">Valor proposta</th>
                      <th className="pb-2 pr-4">Custos IA</th>
                      <th className="pb-2">Lucro bruto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.projectProfit.map((row) => (
                      <tr key={row.projectId} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-2 pr-4">{row.projectName}</td>
                        <td className="py-2 pr-4">{formatBRL(row.proposalValue)}</td>
                        <td className="py-2 pr-4">{formatBRL(row.aiCost)}</td>
                        <td className="py-2 font-medium text-emerald-700 dark:text-emerald-400">
                          {formatBRL(row.netProfit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de chamadas</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              {history.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhuma chamada registrada ainda.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-500 dark:text-slate-400">
                      <th className="pb-2 pr-3">Data</th>
                      <th className="pb-2 pr-3">Projeto</th>
                      <th className="pb-2 pr-3">Etapa</th>
                      <th className="pb-2 pr-3">Modelo</th>
                      <th className="pb-2 pr-3 text-right">Entrada</th>
                      <th className="pb-2 pr-3 text-right">Saída</th>
                      <th className="pb-2 text-right">Custo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row) => (
                      <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {formatDateBR(row.createdAt)}
                        </td>
                        <td className="py-2 pr-3">{row.projectName ?? "—"}</td>
                        <td className="py-2 pr-3">{PROCESS_LABELS[row.process]}</td>
                        <td className="py-2 pr-3">{row.model}</td>
                        <td className="py-2 pr-3 text-right">{row.inputTokens.toLocaleString("pt-BR")}</td>
                        <td className="py-2 pr-3 text-right">{row.outputTokens.toLocaleString("pt-BR")}</td>
                        <td className="py-2 text-right font-medium">{formatBRL(row.totalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
