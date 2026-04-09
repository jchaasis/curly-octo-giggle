import { create } from 'zustand';

interface LocationState {
  lat: number | null;
  lon: number | null;
  displayName: string | null;
  setLocation: (coords: { lat: number; lon: number; displayName: string }) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  lat: null,
  lon: null,
  displayName: null,
  setLocation: ({ lat, lon, displayName }) => set({ lat, lon, displayName }),
  clearLocation: () => set({ lat: null, lon: null, displayName: null }),
}));
