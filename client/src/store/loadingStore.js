import { create } from 'zustand';

let trickleInterval = null;

export const useLoadingStore = create((set, get) => ({
  activeRequests: 0,
  progress: 0,
  visible: false,

  startLoading: () => {
    const current = get().activeRequests;
    const next = current + 1;

    if (current === 0) {
      if (trickleInterval) clearInterval(trickleInterval);
      set({ activeRequests: next, progress: 20, visible: true });

      // Trickle progress up to 90%
      trickleInterval = setInterval(() => {
        const { progress, activeRequests } = get();
        if (activeRequests > 0 && progress < 90) {
          const increment = Math.max(1, (90 - progress) * 0.15);
          set({ progress: Math.min(90, progress + increment) });
        }
      }, 150);
    } else {
      set({ activeRequests: next });
    }
  },

  stopLoading: () => {
    const current = get().activeRequests;
    const next = Math.max(0, current - 1);

    if (next === 0) {
      if (trickleInterval) {
        clearInterval(trickleInterval);
        trickleInterval = null;
      }
      set({ activeRequests: 0, progress: 100 });

      // Fade out after completion
      setTimeout(() => {
        if (get().activeRequests === 0) {
          set({ visible: false, progress: 0 });
        }
      }, 300);
    } else {
      set({ activeRequests: next });
    }
  },
}));
