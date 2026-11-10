import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Database,
  Download,
  Loader2,
  Palette,
  RotateCcw,
  Save,
  Upload,
  Wrench,
  XCircle,
} from "lucide-react";
import { AppLogo } from "@/components/brand/AppLogo";
import { ThemeSelector } from "@/components/theme/ThemeSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelect } from "@/components/settings/ModelSelect";
import { PromptPlaceholdersReference } from "@/components/settings/PromptPlaceholdersReference";
import { formatBRL } from "@/lib/currency";
import { toast } from "@/stores/toastStore";
import {
  exportAgentUrl,
  importAgentPrompt,
  listAgents,
  restoreAgent,
  testAgent,
  updateAgent,
} from "@/services/agents/agentService";
import { testAIConnection } from "@/services/ai/aiProvider";
import {
  getAISettings,
  getAppDataDir,
  listAIModels,
  updateAISettings,
} from "@/services/config/configService";
import type { AIAgent, AgentTestResult } from "@/types/agents";
import { AGENT_PROCESS_LABELS } from "@/types/agents";
import type { AISettings, OpenRouterModel } from "@/types/aiSettings";

type SettingsSection =
  | "general"
  | "ai-credentials"
  | "ai-agents"
  | "database"
  | "appearance"
  | "backup"
  | "export";

interface SettingsPageProps {
  onBack: () => void;
  onOpenCosts: () => void;
  initialSection?: SettingsSection;
}

const NAV: { id: SettingsSection; label: string; group?: string }[] = [
  { id: "general", label: "Geral" },
  { id: "ai-credentials", label: "Credenciais", group: "IA" },
  { id: "ai-agents", label: "Agentes", group: "IA" },
  { id: "database", label: "Banco de Dados" },
  { id: "appearance", label: "Aparência" },
  { id: "backup", label: "Backup" },
  { id: "export", label: "Exportação" },
];

export function SettingsPage({ onBack, onOpenCosts, initialSection = "general" }: SettingsPageProps) {
  const [section, setSection] = useState<SettingsSection>(initialSection);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <AppLogo className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold">Configurações</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Preferências do Freelance Flow</p>
            </div>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 p-4 md:grid-cols-[220px_1fr]">
        <nav className="space-y-1">
          {NAV.map((item, index) => {
            const showGroup =
              item.group && (index === 0 || NAV[index - 1]?.group !== item.group);
            return (
              <div key={item.id}>
                {showGroup && (
                  <p className="mb-1 mt-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {item.group}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    section === item.id
                      ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-200"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                  }`}
                >
                  {item.label}
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={onOpenCosts}
            className="mt-3 w-full rounded-md px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            Custos de IA →
          </button>
        </nav>

        <main>
          {section === "general" && <GeneralSection />}
          {section === "ai-credentials" && <AICredentialsSection />}
          {section === "ai-agents" && <AIAgentsSection />}
          {section === "database" && <DatabaseSection />}
          {section === "appearance" && <AppearanceSection />}
          {section === "backup" && <PlaceholderSection title="Backup" />}
          {section === "export" && <PlaceholderSection title="Exportação" />}
        </main>
      </div>
    </div>
  );
}

function GeneralSection() {
  return (
    <Card className="dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Geral
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
        <p>
          <strong className="text-slate-900 dark:text-slate-100">Freelance Flow</strong> — copiloto
          para freelancers com Kanban, documentos Markdown e agentes de IA especializados.
        </p>
        <p>
          Configure a chave do <strong>OpenRouter</strong> em <strong>IA → Credenciais</strong> e
          personalize os agentes em <strong>IA → Agentes</strong>. A chave fica criptografada no
          banco SQLite local.
        </p>
      </CardContent>
    </Card>
  );
}

function AICredentialsSection() {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [defaultModel, setDefaultModel] = useState("openai/gpt-4.1-mini");
  const [usdToBrl, setUsdToBrl] = useState("5.5");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [nextSettings, nextModels] = await Promise.all([getAISettings(), listAIModels()]);
      setSettings(nextSettings);
      setModels(nextModels);
      setDefaultModel(nextSettings.defaultModel);
      setUsdToBrl(String(nextSettings.usdToBrl));
      setApiKey("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateAISettings({
        apiKey: apiKey.trim() || undefined,
        defaultModel,
        usdToBrl: Number(usdToBrl) || 5.5,
      });
      setSettings(updated);
      setApiKey("");
      toast.success("Configurações de IA salvas");
      const refreshedModels = await listAIModels();
      setModels(refreshedModels);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar";
      setError(message);
      toast.error("Erro ao salvar", message);
    } finally {
      setSaving(false);
    }
  }

  async function handleClearKey() {
    if (!confirm("Remover a chave OpenRouter salva neste computador?")) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateAISettings({ clearApiKey: true });
      setSettings(updated);
      setApiKey("");
      toast.success("Chave removida");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover chave");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    setTestMessage(null);
    setError(null);
    try {
      const result = await testAIConnection({
        apiKey: apiKey.trim() || undefined,
        model: defaultModel,
      });
      setTestResult(result.ok);
      if (result.ok) {
        setTestMessage(result.message ?? `OpenRouter OK · ${result.model}`);
      } else {
        setError(result.error ?? "Falha ao testar OpenRouter com o modelo selecionado");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no teste");
      setTestResult(false);
    } finally {
      setTesting(false);
    }
  }

  const canTest = Boolean(settings?.hasApiKey || apiKey.trim());

  return (
    <Card className="dark:border-slate-700">
      <CardHeader>
        <CardTitle>Credenciais de IA (OpenRouter)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
          <p>
            A aplicação usa o{" "}
            <a
              href="https://openrouter.ai/"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline dark:text-blue-400"
            >
              OpenRouter
            </a>{" "}
            para acessar vários modelos — OpenAI, Anthropic, Google, DeepSeek e outros — com uma
            única chave. A chave fica criptografada no SQLite local e nunca em arquivos versionados.
          </p>
          <p>
            Crie ou copie sua API key em{" "}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline dark:text-blue-400"
            >
              openrouter.ai/keys
            </a>
            .
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-md border border-slate-200 p-3 dark:border-slate-700">
              <div>
                <p className="text-sm font-medium">Status da chave</p>
                <p className="font-mono text-xs text-slate-500">
                  {settings?.apiKeyMasked ?? "Nenhuma chave salva"}
                </p>
              </div>
              <Badge color={settings?.hasApiKey ? "green" : "neutral"}>
                {settings?.hasApiKey ? "Configurada" : "Não configurada"}
              </Badge>
            </div>

            <ModelSelect
              label="Modelo padrão"
              value={defaultModel}
              onValueChange={setDefaultModel}
              models={models}
              hint="Usado pelos agentes quando o modelo específico não for sobrescrito. Preços em USD por 1M tokens (OpenRouter)."
            />

            <div>
              <Label htmlFor="openrouter-key">
                {settings?.hasApiKey ? "Nova chave OpenRouter (opcional)" : "Chave OpenRouter"}
              </Label>
              <Input
                id="openrouter-key"
                type="password"
                autoComplete="off"
                placeholder={
                  settings?.hasApiKey
                    ? "Deixe em branco para manter a chave atual"
                    : "sk-or-..."
                }
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Obtenha a chave em{" "}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline dark:text-blue-400"
                >
                  https://openrouter.ai/keys
                </a>
              </p>
            </div>

            <div>
              <Label htmlFor="usd-brl">Taxa USD → BRL (custos)</Label>
              <Input
                id="usd-brl"
                type="number"
                step="0.01"
                min="0.01"
                value={usdToBrl}
                onChange={(e) => setUsdToBrl(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar
              </Button>
              <Button variant="outline" onClick={handleTest} disabled={testing || !canTest}>
                {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Testar conexão
              </Button>
              {settings?.hasApiKey && (
                <Button variant="ghost" onClick={handleClearKey} disabled={saving}>
                  Remover chave
                </Button>
              )}
              {testResult === true && (
                <span className="flex items-center gap-1 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {testMessage ?? "Conectado"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              O teste envia uma chamada mínima ao OpenRouter com o modelo selecionado e a chave
              informada, ou a chave já salva.
            </p>
            {testResult === false && error && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">Falha no teste de conexão</p>
                  <p className="break-words whitespace-pre-wrap">{error}</p>
                </div>
              </div>
            )}
            {testResult !== false && error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </>
        )}
        {loading && error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}

function AIAgentsSection() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAgents()
      .then(setAgents)
      .finally(() => setLoading(false));
  }, []);

  const selected = agents.find((a) => a.id === selectedId) ?? null;

  function handleUpdated(agent: AIAgent) {
    setAgents((prev) => prev.map((a) => (a.id === agent.id ? agent : a)));
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando agentes...
      </div>
    );
  }

  if (selected) {
    return (
      <AgentEditor
        agent={selected}
        onBack={() => setSelectedId(null)}
        onUpdated={handleUpdated}
      />
    );
  }

  return (
    <Card className="dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Agentes de IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto themed-scrollbar themed-scrollbar-x">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                <th className="pb-2 pr-4 font-medium">Processo</th>
                <th className="pb-2 pr-4 font-medium">Modelo</th>
                <th className="pb-2 pr-4 font-medium">Temperatura</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr
                  key={agent.id}
                  className="cursor-pointer border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                  onClick={() => setSelectedId(agent.id)}
                >
                  <td className="py-3 pr-4">{AGENT_PROCESS_LABELS[agent.process]}</td>
                  <td className="py-3 pr-4">{agent.model}</td>
                  <td className="py-3 pr-4">{agent.temperature}</td>
                  <td className="py-3">
                    <Badge color={agent.enabled ? "green" : "neutral"}>
                      {agent.enabled ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function AgentEditor({
  agent,
  onBack,
  onUpdated,
}: {
  agent: AIAgent;
  onBack: () => void;
  onUpdated: (agent: AIAgent) => void;
}) {
  const [form, setForm] = useState(agent);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sampleInput, setSampleInput] = useState("Descreva um sistema de gestão para oficina mecânica.");
  const [testResult, setTestResult] = useState<AgentTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(agent);
    setTestResult(null);
  }, [agent]);

  useEffect(() => {
    listAIModels()
      .then(setModels)
      .catch(() => setModels([]));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateAgent(agent.id, {
        name: form.name,
        provider: "OPENROUTER",
        model: form.model,
        temperature: form.temperature,
        maxTokens: form.maxTokens,
        systemPrompt: form.systemPrompt,
        generationPrompt: form.generationPrompt,
        previewPrompt: form.previewPrompt,
        enabled: form.enabled,
      });
      onUpdated(updated);
      setForm(updated);
      toast.success("Agente salvo");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
      toast.error("Erro ao salvar agente", err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  async function handleRestore() {
    if (!confirm("Restaurar o prompt padrão deste agente?")) return;
    setRestoring(true);
    setError(null);
    try {
      const updated = await restoreAgent(agent.id);
      onUpdated(updated);
      setForm(updated);
      toast.success("Prompt padrão restaurado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao restaurar");
      toast.error("Erro ao restaurar", err instanceof Error ? err.message : undefined);
    } finally {
      setRestoring(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setError(null);
    setTestResult(null);
    try {
      const result = await testAgent(agent.id, sampleInput);
      setTestResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no teste");
    } finally {
      setTesting(false);
    }
  }

  async function handleImport(file: File) {
    const markdown = await file.text();
    try {
      const updated = await importAgentPrompt(agent.id, markdown);
      onUpdated(updated);
      setForm(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao importar");
    }
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>
        ← Voltar para lista
      </Button>

      <Card className="dark:border-slate-700">
        <CardHeader>
          <CardTitle>{AGENT_PROCESS_LABELS[agent.process]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Provedor</Label>
              <Input value="OpenRouter" disabled />
            </div>
            <div className="md:col-span-2">
              <ModelSelect
                label="Modelo"
                value={form.model}
                onValueChange={(value) => setForm({ ...form, model: value })}
                models={models}
                hint="Preços em USD por 1M tokens (OpenRouter)."
              />
            </div>
            <div>
              <Label>Temperatura ({form.temperature})</Label>
              <Input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={form.temperature}
                onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Máximo de tokens</Label>
              <Input
                type="number"
                value={form.maxTokens}
                onChange={(e) => setForm({ ...form, maxTokens: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                />
                Agente ativo
              </label>
            </div>
          </div>

          <div>
            <Label>Prompt do sistema</Label>
            <Textarea
              className="min-h-[240px] font-mono text-xs"
              value={form.systemPrompt}
              onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
            />
            <div className="mt-3">
              <PromptPlaceholdersReference />
            </div>
          </div>

          {form.generationPrompt !== undefined && form.generationPrompt !== null && (
            <div>
              <Label>Prompt de geração de documento</Label>
              <Textarea
                className="min-h-[120px] font-mono text-xs"
                value={form.generationPrompt ?? ""}
                onChange={(e) => setForm({ ...form, generationPrompt: e.target.value })}
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Usado ao clicar em &quot;Gerar documento&quot; na coluna correspondente. Aceita os
                mesmos placeholders abaixo.
              </p>
              <div className="mt-2">
                <PromptPlaceholdersReference compact />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
            <Button variant="outline" onClick={handleRestore} disabled={restoring}>
              {restoring ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Restaurar padrão
            </Button>
            <Button variant="outline" asChild>
              <a href={exportAgentUrl(agent.id)} download>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </a>
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".md,text/markdown"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
                e.target.value = "";
              }}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      <Card className="dark:border-slate-700">
        <CardHeader>
          <CardTitle>Testar prompt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Texto de exemplo</Label>
            <Textarea
              value={sampleInput}
              onChange={(e) => setSampleInput(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <Button onClick={handleTest} disabled={testing}>
            {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Testar
          </Button>

          {testResult && (
            <div className="space-y-3 rounded-md border border-slate-200 p-3 dark:border-slate-700">
              <div>
                <p className="mb-1 text-xs font-medium uppercase text-slate-500">Prompt final enviado</p>
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded bg-slate-100 p-2 text-xs dark:bg-slate-900">
                  {testResult.finalPrompt}
                </pre>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase text-slate-500">Resposta da IA</p>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded bg-slate-100 p-2 text-xs dark:bg-slate-900">
                  {testResult.response}
                </pre>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
                <span>Tokens: {testResult.usage.totalTokens.toLocaleString("pt-BR")}</span>
                <span>Tempo: {testResult.usage.requestDurationMs} ms</span>
                <span>Custo estimado: {formatBRL(testResult.estimatedCostBRL)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DatabaseSection() {
  const [dataDir, setDataDir] = useState<string | null>(null);

  useEffect(() => {
    getAppDataDir().then(setDataDir).catch(() => setDataDir(null));
  }, []);

  return (
    <Card className="dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Banco de Dados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-slate-500">SQLite local com documentos Markdown em disco.</p>
        <div className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
          <p className="text-xs text-slate-500">Diretório de dados</p>
          <p className="font-mono text-sm">{dataDir ?? "—"}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AppearanceSection() {
  return (
    <Card className="dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Aparência
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <span className="text-sm text-slate-600 dark:text-slate-300">Tema claro / escuro</span>
        <ThemeSelector />
      </CardContent>
    </Card>
  );
}

function PlaceholderSection({ title }: { title: string }) {
  return (
    <Card className="dark:border-slate-700">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-500">Funcionalidade prevista para uma versão futura.</p>
      </CardContent>
    </Card>
  );
}
