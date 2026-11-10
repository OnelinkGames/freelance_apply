import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { listDocuments } from "@/services/documents/documentService";
import { DOCUMENT_LABELS, type DocumentRecord } from "@/types/project";
import { formatDate } from "@/lib/dates";

interface DocumentsSectionProps {
  projectId: string;
}

export function DocumentsSection({ projectId }: DocumentsSectionProps) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);

  useEffect(() => {
    listDocuments(projectId).then(setDocuments);
  }, [projectId]);

  if (documents.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Documentos gerados</h4>
      <div className="space-y-1">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/60"
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" />
              {DOCUMENT_LABELS[doc.type]}
            </span>
            <span className="text-xs text-slate-400">{formatDate(doc.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
