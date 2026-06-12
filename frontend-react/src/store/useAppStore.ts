import { create } from 'zustand';

type Status = 'pending' | 'confirmed' | 'draft';

interface DimStatus {
  structural: Status;
  behavioral: Status;
  rules: Status;
  events: Status;
  interfaces: Status;
}

interface AppState {
  currentEntity: string | null;
  dimensionStatus: DimStatus;
  isLoading: boolean;
  setCurrentEntity: (e: string | null) => void;
  setDimStatus: (dim: keyof DimStatus, s: Status) => void;
  setLoading: (l: boolean) => void;
}

const defaults: DimStatus = {
  structural: 'pending',
  behavioral: 'pending',
  rules: 'pending',
  events: 'pending',
  interfaces: 'pending',
};

export const useAppStore = create<AppState>((set) => ({
  currentEntity: null,
  dimensionStatus: defaults,
  isLoading: false,
  setCurrentEntity: (e) => set({ currentEntity: e }),
  setDimStatus: (dim, s) =>
    set((st) => ({
      dimensionStatus: { ...st.dimensionStatus, [dim]: s },
    })),
  setLoading: (l) => set({ isLoading: l }),
}));
