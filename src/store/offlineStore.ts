import { create } from 'zustand';

interface OfflineState {
  isOnline: boolean;
  pendingActions: Array<{
    id: string;
    type: string;
    data: any;
    timestamp: number;
  }>;
  addPendingAction: (type: string, data: any) => void;
  removePendingAction: (id: string) => void;
  setOnline: (status: boolean) => void;
  syncPendingActions: () => Promise<void>;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: navigator.onLine,
  pendingActions: [],
  
  addPendingAction: (type: string, data: any) => {
    const id = `${Date.now()}-${Math.random()}`;
    set((state) => ({
      pendingActions: [
        ...state.pendingActions,
        { id, type, data, timestamp: Date.now() },
      ],
    }));
    // Save to localStorage
    localStorage.setItem('pending-actions', JSON.stringify(get().pendingActions));
  },
  
  removePendingAction: (id: string) => {
    set((state) => ({
      pendingActions: state.pendingActions.filter((action) => action.id !== id),
    }));
    localStorage.setItem('pending-actions', JSON.stringify(get().pendingActions));
  },
  
  setOnline: (status: boolean) => {
    set({ isOnline: status });
    if (status) {
      get().syncPendingActions();
    }
  },
  
  syncPendingActions: async () => {
    const { pendingActions } = get();
    
    for (const action of pendingActions) {
      try {
        // Send action to API
        // await api.syncAction(action);
        get().removePendingAction(action.id);
      } catch (error) {
        console.error('Failed to sync action:', error);
      }
    }
  },
}));

// Listen to online/offline events
window.addEventListener('online', () => {
  useOfflineStore.getState().setOnline(true);
});

window.addEventListener('offline', () => {
  useOfflineStore.getState().setOnline(false);
});
