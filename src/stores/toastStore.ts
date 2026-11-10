import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: Toast[];
  add: (toast: Omit<Toast, "id">) => string;
  remove: (id: string) => void;
}

const DISMISS_MS = 4500;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  add: (toast) => {
    const id = crypto.randomUUID();
    set({ toasts: [...get().toasts, { ...toast, id }] });
    window.setTimeout(() => get().remove(id), DISMISS_MS);
    return id;
  },

  remove: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = {
  success(title: string, description?: string) {
    return useToastStore.getState().add({ title, description, variant: "success" });
  },
  error(title: string, description?: string) {
    return useToastStore.getState().add({ title, description, variant: "error" });
  },
  info(title: string, description?: string) {
    return useToastStore.getState().add({ title, description, variant: "info" });
  },
};
