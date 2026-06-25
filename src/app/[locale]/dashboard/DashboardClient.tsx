'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateWorkoutPlan } from '@/app/actions/generatePlan';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Dumbbell, 
  Apple, 
  Trash2, 
  Edit2, 
  Plus, 
  Loader2, 
  LogOut, 
  Settings, 
  User, 
  Flame, 
  Activity, 
  Calendar,
  AlertCircle,
  X,
  Check
} from 'lucide-react';

interface ProfileType {
  id: string;
  goal: string | null;
  weight: number | null;
  height: number | null;
  age: number | null;
  activity_level: string | null;
  training_days: number | null;
  equipment: string | null;
  diet_preference: string | null;
}

interface DashboardClientProps {
  initialProfile: ProfileType;
  userEmail: string;
}

export default function DashboardClient({ initialProfile, userEmail }: DashboardClientProps) {
  const t = useTranslations('Dashboard');
  const tCommon = useTranslations('Common');
  const tOnboarding = useTranslations('Onboarding');
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'workout' | 'nutrition'>('workout');
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  
  // Modal states
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<{
    dayIdx: number;
    exerciseIdx: number;
    exercise_name: string;
    sets: number;
    reps_or_duration: string;
    rest_seconds: number;
    notes?: string;
  } | null>(null);

  // 1. Fetch saved workout plans via React Query
  const { data: plans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: ['workout_plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_plans')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Determine active plan (either selected or the most recent one)
  const activePlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  // 2. Generate Plan Mutation (Calling Ticket 4 Server Action)
  const generateMutation = useMutation({
    mutationFn: async () => {
      const result = await generateWorkoutPlan(locale);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.plan;
    },
    onSuccess: (newPlan) => {
      queryClient.invalidateQueries({ queryKey: ['workout_plans'] });
      if (newPlan) {
        setSelectedPlanId(newPlan.id);
        setSelectedDayIdx(0);
      }
    },
    onError: (err: any) => {
      alert(err.message || 'Generation failed');
    }
  });

  // 3. Update Plan (Exercise Edit) Mutation
  const updatePlanMutation = useMutation({
    mutationFn: async (updatedPlanData: any) => {
      const { error } = await supabase
        .from('workout_plans')
        .update({ plan_data: updatedPlanData })
        .eq('id', activePlan.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_plans'] });
      setEditingExercise(null);
    },
    onError: (err: any) => {
      alert(err.message || 'Update failed');
    }
  });

  // 4. Delete Plan Mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('workout_plans')
        .delete()
        .eq('id', planId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_plans'] });
      setIsDeleting(null);
      setSelectedPlanId(null);
      setSelectedDayIdx(0);
    },
    onError: (err: any) => {
      alert(err.message || 'Deletion failed');
    }
  });

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth?mode=login');
  };

  // Save exercise changes
  const saveExerciseEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExercise || !activePlan) return;

    const { dayIdx, exerciseIdx, ...editedValues } = editingExercise;
    const planDataCopy = JSON.parse(JSON.stringify(activePlan.plan_data));
    
    // Apply changes
    planDataCopy.workout_days[dayIdx].exercises[exerciseIdx] = editedValues;

    updatePlanMutation.mutate(planDataCopy);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full max-w-7xl mx-auto px-4 py-8 gap-8">
      
      {/* LEFT SIDEBAR: PROFILE & PLAN HISTORY */}
      <aside className="w-full md:w-80 space-y-6 shrink-0">
        
        {/* Profile Card */}
        <div className="rounded-2xl border border-white/10 bg-[#12121a]/80 p-6 shadow-xl backdrop-blur-md space-y-5">
          <div className="flex items-center gap-3.5 pb-4 border-b border-white/5">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-emerald-500 to-violet-600 flex items-center justify-center text-white font-bold">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-emerald-400 uppercase tracking-wider">Active Coach Profile</span>
              <span className="block text-sm text-slate-200 truncate font-semibold mt-0.5">{userEmail}</span>
            </div>
          </div>

          {/* Profile details list */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="block text-slate-500 uppercase tracking-wider font-semibold">Goal</span>
              <span className="block text-slate-300 font-bold mt-0.5">
                {tOnboarding(`goals.${initialProfile.goal}`)}
              </span>
            </div>
            <div>
              <span className="block text-slate-500 uppercase tracking-wider font-semibold">Metrics</span>
              <span className="block text-slate-300 font-bold mt-0.5">
                {initialProfile.weight}kg / {initialProfile.height}cm
              </span>
            </div>
            <div>
              <span className="block text-slate-500 uppercase tracking-wider font-semibold">Schedule</span>
              <span className="block text-slate-300 font-bold mt-0.5">
                {initialProfile.training_days} {tOnboarding('schedule.days_unit')}
              </span>
            </div>
            <div>
              <span className="block text-slate-500 uppercase tracking-wider font-semibold">Diet Preference</span>
              <span className="block text-slate-300 font-bold mt-0.5 truncate">
                {tOnboarding(`nutrition.${initialProfile.diet_preference}`).split(' (')[0]}
              </span>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/settings')}
              className="flex-1 border-white/10 hover:bg-white/5 text-xs text-slate-300 gap-1.5"
            >
              <Settings className="h-3.5 w-3.5 text-slate-400" />
              {tCommon('settings')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-white/10 hover:bg-red-500/10 hover:text-red-400 text-xs text-slate-300 px-3"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Saved Plans History */}
        <div className="rounded-2xl border border-white/10 bg-[#12121a]/80 p-6 shadow-xl backdrop-blur-md space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {t('myPlans')}
          </h3>

          {isLoadingPlans ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
            </div>
          ) : plans.length === 0 ? (
            <span className="block text-xs text-slate-500 font-light">No saved plans found.</span>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPlanId(p.id);
                    setSelectedDayIdx(0);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border text-left text-xs font-medium transition-all duration-200 ${
                    activePlan?.id === p.id
                      ? 'border-emerald-500 bg-emerald-500/5 text-white'
                      : 'border-white/5 bg-white/[0.01] hover:bg-white/5 text-slate-400'
                  }`}
                >
                  <span className="truncate font-semibold max-w-[170px]">{p.name}</span>
                  <span className="text-[10px] text-slate-600 font-semibold">
                    {new Date(p.created_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* AI Generate Button */}
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white font-bold h-10 shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">{t('generating')}</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span className="text-xs">{t('generateNewPlan')}</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* RIGHT MAIN PANEL: ACTIVE PLAN VIEWER & CRUD */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Generating AI Overlay */}
        {generateMutation.isPending && (
          <div className="flex-1 flex flex-col justify-center items-center rounded-2xl border border-white/10 bg-[#12121a]/80 p-8 shadow-xl backdrop-blur-md min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">{t('generating')}</h2>
            <p className="text-xs text-slate-400 text-center max-w-sm">
              Gemini is creating a tailored workout and nutrition guide based on your profile. Please hold on...
            </p>
          </div>
        )}

        {/* Empty Active Plan View */}
        {!generateMutation.isPending && !activePlan && (
          <div className="flex-1 flex flex-col justify-center items-center rounded-2xl border border-white/10 bg-[#12121a]/80 p-8 shadow-xl backdrop-blur-md min-h-[400px] text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center text-slate-500">
              <Dumbbell className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">No Active Plan</h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">{t('noActivePlan')}</p>
            </div>
            <Button
              onClick={() => generateMutation.mutate()}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white font-bold h-11 px-8 rounded-lg shadow-lg shadow-emerald-500/10 flex items-center gap-2"
            >
              <Plus className="h-4.5 w-4.5" />
              {t('generateNewPlan')}
            </Button>
          </div>
        )}

        {/* Loaded Active Plan View */}
        {!generateMutation.isPending && activePlan && (
          <div className="flex-grow space-y-6">
            
            {/* Plan Header Card */}
            <div className="rounded-2xl border border-white/10 bg-[#12121a]/80 p-6 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shadow-inner">
                  <Dumbbell className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('activePlan')}</span>
                  <h2 className="text-lg font-bold text-white tracking-tight">{activePlan.name}</h2>
                </div>
              </div>

              {/* Workout vs Nutrition tabs */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
                  <button
                    onClick={() => setActiveTab('workout')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      activeTab === 'workout' 
                        ? 'bg-emerald-500 text-white shadow-md' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Dumbbell className="h-3.5 w-3.5" />
                    {t('workoutPlan')}
                  </button>
                  <button
                    onClick={() => setActiveTab('nutrition')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      activeTab === 'nutrition' 
                        ? 'bg-emerald-500 text-white shadow-md' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Apple className="h-3.5 w-3.5" />
                    {t('nutritionPlan')}
                  </button>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => setIsDeleting(activePlan.id)}
                  className="text-slate-500 hover:text-red-400 p-2 h-9 w-9 rounded-lg hover:bg-red-500/5 transition-all shrink-0"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </Button>
              </div>
            </div>

            {/* TAB CONTENT: WORKOUT PLAN */}
            {activeTab === 'workout' && (
              <div className="space-y-6">
                {/* Days Navigation Tabs */}
                <div className="flex overflow-x-auto gap-2.5 pb-2 scrollbar-none">
                  {activePlan.plan_data.workout_days.map((day: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedDayIdx(idx)}
                      className={`px-4 py-2.5 rounded-xl border font-bold text-xs shrink-0 transition-all ${
                        selectedDayIdx === idx
                          ? 'border-emerald-500 bg-emerald-500/5 text-white'
                          : 'border-white/5 bg-[#12121a]/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      {day.day_name}
                    </button>
                  ))}
                </div>

                {/* Exercises list for the selected day */}
                <div className="rounded-2xl border border-white/10 bg-[#12121a]/80 shadow-xl overflow-hidden backdrop-blur-md">
                  <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Focus: <span className="text-white">{activePlan.plan_data.workout_days[selectedDayIdx]?.focus}</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {activePlan.plan_data.workout_days[selectedDayIdx]?.exercises.length} Exercises
                    </span>
                  </div>

                  <div className="divide-y divide-white/5">
                    {activePlan.plan_data.workout_days[selectedDayIdx]?.exercises.map((ex: any, idx: number) => (
                      <div 
                        key={idx}
                        className="p-6 hover:bg-white/[0.01] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        {/* Name & Notes */}
                        <div className="space-y-1.5">
                          <span className="block text-sm font-bold text-white flex items-center gap-2">
                            <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
                            {ex.exercise_name}
                          </span>
                          {ex.notes && (
                            <span className="block text-xs text-slate-400 font-light leading-relaxed pl-5">
                              {ex.notes}
                            </span>
                          )}
                        </div>

                        {/* Sets / Reps / Rest details */}
                        <div className="flex items-center justify-between sm:justify-end gap-6 pl-5 sm:pl-0">
                          <div className="flex items-center gap-5 text-xs text-slate-300 font-semibold">
                            <div>
                              <span className="block text-[9px] font-semibold uppercase tracking-wider text-slate-500">Sets</span>
                              <span className="block font-bold text-white mt-0.5">{ex.sets}</span>
                            </div>
                            <div>
                              <span className="block text-[9px] font-semibold uppercase tracking-wider text-slate-500">Reps</span>
                              <span className="block font-bold text-white mt-0.5">{ex.reps_or_duration}</span>
                            </div>
                            <div>
                              <span className="block text-[9px] font-semibold uppercase tracking-wider text-slate-500">Rest</span>
                              <span className="block font-bold text-white mt-0.5">{ex.rest_seconds}s</span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            onClick={() => setEditingExercise({
                              dayIdx: selectedDayIdx,
                              exerciseIdx: idx,
                              ...ex
                            })}
                            className="text-slate-500 hover:text-emerald-400 p-2 h-8 w-8 rounded-lg hover:bg-emerald-500/5 transition-all shrink-0 ml-2"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: NUTRITION PLAN */}
            {activeTab === 'nutrition' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Meal Template (Left Column) */}
                <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#12121a]/80 p-6 shadow-xl space-y-4 backdrop-blur-md">
                  <h3 className="text-sm font-bold text-slate-300 pb-2 border-b border-white/5 flex items-center gap-2">
                    <Apple className="h-4.5 w-4.5 text-emerald-400" />
                    Meal Schedule
                  </h3>

                  <div className="space-y-4">
                    {/* Breakfast */}
                    <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5">
                      <span className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                        {t('nutritionMeals.breakfast')}
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        {activePlan.plan_data.nutrition_plan.daily_meal_template.breakfast}
                      </p>
                    </div>

                    {/* Lunch */}
                    <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5">
                      <span className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                        {t('nutritionMeals.lunch')}
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        {activePlan.plan_data.nutrition_plan.daily_meal_template.lunch}
                      </p>
                    </div>

                    {/* Dinner */}
                    <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5">
                      <span className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                        {t('nutritionMeals.dinner')}
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        {activePlan.plan_data.nutrition_plan.daily_meal_template.dinner}
                      </p>
                    </div>

                    {/* Snacks */}
                    {activePlan.plan_data.nutrition_plan.daily_meal_template.snacks && (
                      <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5">
                        <span className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                          {t('nutritionMeals.snacks')}
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                          {activePlan.plan_data.nutrition_plan.daily_meal_template.snacks}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Macro Target & Tips (Right Column) */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Target Macros card */}
                  <div className="rounded-2xl border border-white/10 bg-[#12121a]/80 p-6 shadow-xl backdrop-blur-md space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t('macroSummary')}
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Calories */}
                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-center">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {t('calories')}
                        </span>
                        <span className="block text-xl font-black text-white mt-1">
                          {activePlan.plan_data.nutrition_plan.target_calories_kcal}
                        </span>
                        <span className="text-[9px] text-slate-500 font-semibold">kcal</span>
                      </div>

                      {/* Protein */}
                      <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                        <span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          {t('protein')}
                        </span>
                        <span className="block text-xl font-black text-emerald-300 mt-1">
                          {activePlan.plan_data.nutrition_plan.target_protein_g}
                        </span>
                        <span className="text-[9px] text-emerald-500 font-semibold">g</span>
                      </div>

                      {/* Carbs */}
                      <div className="p-3.5 rounded-xl bg-violet-500/5 border border-violet-500/10 text-center">
                        <span className="block text-[10px] font-bold text-violet-400 uppercase tracking-wider">
                          {t('carbs')}
                        </span>
                        <span className="block text-xl font-black text-violet-300 mt-1">
                          {activePlan.plan_data.nutrition_plan.target_carbs_g}
                        </span>
                        <span className="text-[9px] text-violet-500 font-semibold">g</span>
                      </div>

                      {/* Fat */}
                      <div className="p-3.5 rounded-xl bg-teal-500/5 border border-teal-500/10 text-center">
                        <span className="block text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                          {t('fat')}
                        </span>
                        <span className="block text-xl font-black text-teal-300 mt-1">
                          {activePlan.plan_data.nutrition_plan.target_fat_g}
                        </span>
                        <span className="text-[9px] text-teal-500 font-semibold">g</span>
                      </div>
                    </div>
                  </div>

                  {/* General Tips card */}
                  <div className="rounded-2xl border border-white/10 bg-[#12121a]/80 p-6 shadow-xl backdrop-blur-md space-y-3.5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t('generalTips')}
                    </h3>
                    <ul className="space-y-2.5">
                      {activePlan.plan_data.nutrition_plan.general_tips.map((tip: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-400 font-light flex items-start gap-2.5 leading-relaxed">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* EDIT EXERCISE DIALOG (Modal overlay) */}
      <AnimatePresence>
        {editingExercise && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingExercise(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#161622] p-6 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-5">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit2 className="h-4 w-4 text-emerald-400" />
                  {t('editExercise')}
                </span>
                <button 
                  onClick={() => setEditingExercise(null)}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={saveExerciseEdit} className="space-y-4">
                {/* Exercise name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {t('exerciseName')}
                  </label>
                  <input
                    type="text"
                    value={editingExercise.exercise_name}
                    onChange={(e) => setEditingExercise({ ...editingExercise, exercise_name: e.target.value })}
                    required
                    className="w-full h-10 px-3.5 rounded-lg border border-white/10 bg-white/5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Sets */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {t('sets')}
                    </label>
                    <input
                      type="number"
                      value={editingExercise.sets}
                      onChange={(e) => setEditingExercise({ ...editingExercise, sets: parseInt(e.target.value) || 0 })}
                      required
                      className="w-full h-10 px-3.5 rounded-lg border border-white/10 bg-white/5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50 text-center"
                    />
                  </div>

                  {/* Reps */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {t('reps')}
                    </label>
                    <input
                      type="text"
                      value={editingExercise.reps_or_duration}
                      onChange={(e) => setEditingExercise({ ...editingExercise, reps_or_duration: e.target.value })}
                      required
                      className="w-full h-10 px-3.5 rounded-lg border border-white/10 bg-white/5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50 text-center"
                    />
                  </div>

                  {/* Rest */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {t('rest')}
                    </label>
                    <input
                      type="number"
                      value={editingExercise.rest_seconds}
                      onChange={(e) => setEditingExercise({ ...editingExercise, rest_seconds: parseInt(e.target.value) || 0 })}
                      required
                      className="w-full h-10 px-3.5 rounded-lg border border-white/10 bg-white/5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50 text-center"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {t('notes')}
                  </label>
                  <textarea
                    value={editingExercise.notes || ''}
                    onChange={(e) => setEditingExercise({ ...editingExercise, notes: e.target.value })}
                    rows={2}
                    className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50 resize-none"
                  />
                </div>

                {/* Save button */}
                <Button
                  type="submit"
                  disabled={updatePlanMutation.isPending}
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-1.5"
                >
                  {updatePlanMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {tCommon('save')}
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE MODAL */}
      <AnimatePresence>
        {isDeleting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleting(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#161622] p-6 shadow-2xl z-10 text-center space-y-6"
            >
              <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
                <AlertCircle className="h-6 w-6" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">{tCommon('delete')}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('deleteConfirm')}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleting(null)}
                  disabled={deletePlanMutation.isPending}
                  className="flex-1 border-white/10 hover:bg-white/5 text-xs text-slate-300"
                >
                  {tCommon('cancel')}
                </Button>
                <Button
                  onClick={() => deletePlanMutation.mutate(isDeleting)}
                  disabled={deletePlanMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                >
                  {deletePlanMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    tCommon('delete')
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
