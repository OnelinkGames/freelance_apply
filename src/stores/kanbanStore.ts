import { create } from "zustand";
import type { KanbanColumn, Project } from "@/types/project";
import * as projectService from "@/services/projects/projectService";

interface KanbanState {
  columns: KanbanColumn[];
  projects: Project[];
  loading: boolean;
  error: string | null;
  selectedProjectId: string | null;
  settingsOpen: boolean;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  selectProject: (id: string | null) => void;
  createProject: (input: projectService.CreateProjectInput) => Promise<void>;
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>;
  moveProject: (id: string, column: Project["currentColumn"]) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setSettingsOpen: (open: boolean) => void;
}

export const useKanbanStore = create<KanbanState>((set) => ({
  columns: [],
  projects: [],
  loading: true,
  error: null,
  selectedProjectId: null,
  settingsOpen: false,

  initialize: async () => {
    set({ loading: true, error: null });
    try {
      const [columns, projects] = await Promise.all([
        projectService.listColumns(),
        projectService.listProjects(),
      ]);
      set({ columns, projects, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Erro ao carregar dados",
      });
    }
  },

  refresh: async () => {
    const projects = await projectService.listProjects();
    set({ projects });
  },

  selectProject: (id) => set({ selectedProjectId: id }),

  createProject: async (input) => {
    const project = await projectService.createProject(input);
    set((state) => ({ projects: [...state.projects, project], selectedProjectId: project.id }));
  },

  updateProject: async (id, patch) => {
    const updated = await projectService.updateProject(id, patch);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
    }));
  },

  moveProject: async (id, column) => {
    const updated = await projectService.moveProject(id, column);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
    }));
  },

  deleteProject: async (id) => {
    await projectService.deleteProject(id);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
    }));
  },

  setSettingsOpen: (open) => set({ settingsOpen: open }),
}));

export function getSelectedProject(state: KanbanState): Project | null {
  if (!state.selectedProjectId) return null;
  return state.projects.find((p) => p.id === state.selectedProjectId) ?? null;
}
