import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { addComment, deleteComment, listComments } from "@/services/comments/commentService";
import { toast } from "@/stores/toastStore";
import type { Comment } from "@/types/project";

interface CommentsSectionProps {
  projectId: string;
}

export function CommentsSection({ projectId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadComments() {
    const data = await listComments(projectId);
    setComments(data);
  }

  useEffect(() => {
    loadComments();
  }, [projectId]);

  async function handleAdd() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await addComment(projectId, text.trim());
      setText("");
      await loadComments();
      toast.success("Comentário adicionado");
    } catch (err) {
      toast.error("Erro ao comentar", err instanceof Error ? err.message : undefined);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteComment(id);
      await loadComments();
      toast.success("Comentário removido");
    } catch (err) {
      toast.error("Erro ao remover", err instanceof Error ? err.message : undefined);
    }
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Comentários</h4>
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Adicionar comentário..."
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={loading || !text.trim()} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
        </Button>
      </div>
      <ScrollArea className="max-h-48 rounded-md border border-slate-200 dark:border-slate-700">
        <div className="space-y-2 p-3">
          {comments.length === 0 && (
            <p className="text-sm text-slate-400">Nenhum comentário ainda.</p>
          )}
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start justify-between gap-2 rounded-md bg-slate-50 p-2 dark:bg-slate-800/60">
              <div>
                <p className="text-sm">{comment.text}</p>
                <p className="text-xs text-slate-400">
                  {new Date(comment.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(comment.id)}>
                <Trash2 className="h-4 w-4 text-slate-400" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
