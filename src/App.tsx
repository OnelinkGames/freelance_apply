import { useEffect, useState } from "react";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { CostsPage } from "@/components/costs/CostsPage";
import { ProjectDetailSheet } from "@/components/project/ProjectDetailSheet";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { Toaster } from "@/components/ui/toaster";
import { useKanbanStore } from "@/stores/kanbanStore";

type AppPage = "kanban" | "costs" | "settings";

function App() {
  const [page, setPage] = useState<AppPage>("kanban");
  const initialize = useKanbanStore((s) => s.initialize);
  const columns = useKanbanStore((s) => s.columns);
  const projects = useKanbanStore((s) => s.projects);
  const selectedProjectId = useKanbanStore((s) => s.selectedProjectId);
  const selectProject = useKanbanStore((s) => s.selectProject);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;
  const columnName =
    columns.find((c) => c.slug === selectedProject?.currentColumn)?.name ?? "";

  if (page === "costs") {
    return (
      <>
        <CostsPage onBack={() => setPage("kanban")} />
        <Toaster />
      </>
    );
  }

  if (page === "settings") {
    return (
      <>
        <SettingsPage
          onBack={() => setPage("kanban")}
          onOpenCosts={() => setPage("costs")}
        />
        <Toaster />
      </>
    );
  }

  return (
    <div className="relative min-h-screen">
      <Toaster />
      <KanbanBoard
        onOpenSettings={() => setPage("settings")}
        onOpenCosts={() => setPage("costs")}
      />
      {selectedProject && (
        <>
          <div className="fixed inset-0 z-30 bg-black/20" onClick={() => selectProject(null)} />
          <ProjectDetailSheet
            project={selectedProject}
            columnName={columnName}
            onClose={() => selectProject(null)}
          />
        </>
      )}
    </div>
  );
}

export default App;
