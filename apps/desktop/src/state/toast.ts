import { create } from 'zustand';

export interface ToastItem {
  id: number;
  text: string;
}

interface ToastState {
  items: ToastItem[];
  push(text: string): void;
  dismiss(id: number): void;
}

let next = 1;

export const useToast = create<ToastState>()((set) => ({
  items: [],
  push: (text) => set((s) => ({ items: [...s.items, { id: next++, text }].slice(-3) })),
  dismiss: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}));
