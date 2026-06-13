import { create } from 'zustand';

type Status = 'pending' | 'confirmed' | 'draft';

interface DimStatus {
  structural: Status;
  behavioral: Status;
  rules: Status;
  events: Status;
  interfaces: Status;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DimData = Record<string, any>;

interface AppState {
  currentEntity: string | null;
  dimensionStatus: DimStatus;
  isLoading: boolean;
  structuralData: DimData;
  behavioralData: DimData;
  rulesData: DimData;
  eventsData: DimData;
  interfacesData: DimData;
  epcData: DimData;
  setCurrentEntity: (e: string | null) => void;
  setDimStatus: (dim: keyof DimStatus, s: Status) => void;
  setLoading: (l: boolean) => void;
  setLLMResponse: (data: Record<string, DimData>) => void;
}

const dimDefaults: DimStatus = {
  structural: 'pending',
  behavioral: 'pending',
  rules: 'pending',
  events: 'pending',
  interfaces: 'pending',
};

export const useAppStore = create<AppState>((set) => ({
  currentEntity: null,
  dimensionStatus: dimDefaults,
  isLoading: false,
  structuralData: {},
  behavioralData: {},
  rulesData: {},
  eventsData: {},
  interfacesData: {},
  epcData: {},
  setCurrentEntity: (e) => set({ currentEntity: e }),
  setDimStatus: (dim, s) =>
    set((st) => ({
      dimensionStatus: { ...st.dimensionStatus, [dim]: s },
    })),
  setLoading: (l) => set({ isLoading: l }),
  setLLMResponse: (data) =>
    set({
      structuralData: data.structural || {},
      behavioralData: data.behavioral || {},
      rulesData: data.rules || {},
      eventsData: data.events || {},
      interfacesData: data.interfaces || {},
      epcData: data.epc || {},
    }),
}));
