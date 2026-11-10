import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { setActiveConversation } from "@/services/ai/openaiProvider";
import {
  getOrCreateConversation,
  listMessages,
  sendChatMessage,
} from "@/services/ai/aiConversationService";
import { toast } from "@/stores/toastStore";
import type { AgentProcess } from "@/types/agents";
import type { AIMessage } from "@/types/project";

interface AIChatPanelProps {
  projectId: string;
  columnSlug: string;
  process: AgentProcess;
  onAssistantReply?: (content: string) => void;
  onMessagesChange?: (messages: AIMessage[]) => void;
}

export function AIChatPanel({
  projectId,
  columnSlug,
  process,
  onAssistantReply,
  onMessagesChange,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const conversation = await getOrCreateConversation(projectId, columnSlug);
      setConversationId(conversation.id);
      setActiveConversation(conversation.id);
      const history = await listMessages(conversation.id);
      setMessages(history);
      onMessagesChange?.(history);
    }
    load();
  }, [projectId, columnSlug, onMessagesChange]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    if (!input.trim() || !conversationId || loading) return;

    setError(null);
    setLoading(true);
    const userText = input.trim();
    setInput("");

    try {
      const tempUser: AIMessage = {
        id: "temp-user",
        conversationId,
        role: "user",
        content: userText,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUser]);

      const assistantMessage = await sendChatMessage(conversationId, userText, process);
      const history = await listMessages(conversationId);
      setMessages(history);
      onMessagesChange?.(history);
      onAssistantReply?.(assistantMessage.content);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao conversar com a IA";
      setError(message);
      toast.error("Erro na conversa com IA", message);
      const history = await listMessages(conversationId);
      setMessages(history);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="text-sm text-slate-400">
              Inicie a conversa. O agente de IA usará o prompt configurado em Configurações → Agentes.
            </p>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-full overflow-hidden rounded-lg px-3 py-2 text-sm ${
                message.role === "user"
                  ? "ml-8 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100"
                  : "mr-8 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
              }`}
            >
              <p className="mb-1 text-xs font-medium uppercase opacity-60">
                {message.role === "user" ? "Você" : "IA"}
              </p>
              <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                {message.content}
              </p>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              IA respondendo...
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {error && <p className="shrink-0 px-4 text-sm text-red-600">{error}</p>}

      <div className="flex shrink-0 items-end gap-2 border-t border-slate-200 p-3 dark:border-slate-700">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua mensagem... (Shift+Enter para nova linha)"
          rows={2}
          className="min-h-[2.5rem] max-h-32 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={loading}
        />
        <Button onClick={handleSend} disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
