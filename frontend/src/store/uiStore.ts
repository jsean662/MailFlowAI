import { create } from 'zustand';
import type { Theme, ComposeDraft } from '../types/ui';

interface UIState {
    theme: Theme;
    toggleTheme: () => void;
    initializeTheme: () => void;

    composeDraft: ComposeDraft;
    updateDraft: (draft: Partial<ComposeDraft>) => void;
    clearDraft: () => void;

    notification: { message: string; type: 'info' | 'success' | 'error' } | null;
    showNotification: (message: string, type?: 'info' | 'success' | 'error') => void;
    clearNotification: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
    theme: 'light',

    initializeTheme: () => {
        // Check local storage or system preference
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) {
            set({ theme: savedTheme });
            document.documentElement.classList.toggle('dark', savedTheme === 'dark');
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            set({ theme: 'dark' });
            document.documentElement.classList.add('dark');
        }
    },

    toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    },

    composeDraft: {
        to: '',
        subject: '',
        body: '',
    },

    updateDraft: (draft) => set((state) => ({
        composeDraft: { ...state.composeDraft, ...draft }
    })),

    clearDraft: () => set({
        composeDraft: { to: '', subject: '', body: '' }
    }),

    notification: null,

    showNotification: (message, type = 'info') => {
        set({ notification: { message, type } });
        // Auto dismiss after 5 seconds
        setTimeout(() => {
            get().clearNotification();
        }, 5000);
    },

    clearNotification: () => set({ notification: null }),
}));
