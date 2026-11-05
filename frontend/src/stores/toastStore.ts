import { create } from 'zustand';

export type ToastKind = 'success' | 'error';
export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

export const TOAST_SUCCESS_MS = 3000;

interface ToastState {
  toasts: ToastItem[];
  showToast: (kind: ToastKind, message: string) => number;
  dismissToast: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  showToast: (kind, message) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }] }));
    // 성공만 자동 닫힘, 실패는 사용자가 읽고 직접 닫는다 (SG-14)
    if (kind === 'success') setTimeout(() => get().dismissToast(id), TOAST_SUCCESS_MS);
    return id;
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
