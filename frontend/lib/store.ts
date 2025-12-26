import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AppState {
  availableEquipment: string[];
  selectedMuscleGroup: string | null;
  user: User | null;
  token: string | null;
  toggleEquipment: (equipment: string) => void;
  setSelectedMuscleGroup: (muscle: string | null) => void;
  setEquipment: (equipment: string[]) => void;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      availableEquipment: ['Full Gym'],
      selectedMuscleGroup: null,
      user: null,
      token: null,
      setSelectedMuscleGroup: (muscle) => set({ selectedMuscleGroup: muscle }),
      toggleEquipment: (item) =>
        set((state) => {
          const exists = state.availableEquipment.includes(item);
          if (exists) {
            return { availableEquipment: state.availableEquipment.filter((i) => i !== item) };
          }
          return { availableEquipment: [...state.availableEquipment, item] };
        }),
      setEquipment: (items) => set({ availableEquipment: items }),
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'fitsync-storage',
    }
  )
);
