import { create } from 'zustand';

interface CoachState {
  selectedPlanId: string | null;
  setSelectedPlanId: (id: string | null) => void;
  selectedDayIdx: number;
  setSelectedDayIdx: (idx: number) => void;
}

export const useCoachStore = create<CoachState>((set) => ({
  selectedPlanId: null,
  setSelectedPlanId: (id) => set({ selectedPlanId: id }),
  selectedDayIdx: 0,
  setSelectedDayIdx: (idx) => set({ selectedDayIdx: idx }),
}));
