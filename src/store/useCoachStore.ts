import { create } from 'zustand';

interface CoachState {
  selectedPlanId: string | null;
  setSelectedPlanId: (id: string | null) => void;
  selectedDayIdx: number;
  setSelectedDayIdx: (idx: number) => void;
  isGeneratingPlan: boolean;
  setIsGeneratingPlan: (val: boolean) => void;
}

export const useCoachStore = create<CoachState>((set) => ({
  selectedPlanId: null,
  setSelectedPlanId: (id) => set({ selectedPlanId: id }),
  selectedDayIdx: 0,
  setSelectedDayIdx: (idx) => set({ selectedDayIdx: idx }),
  isGeneratingPlan: false,
  setIsGeneratingPlan: (val) => set({ isGeneratingPlan: val }),
}));
