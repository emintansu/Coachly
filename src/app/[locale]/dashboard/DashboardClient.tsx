'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateWorkoutPlan } from '@/app/actions/generatePlan';
import { useCoachStore } from '@/store/useCoachStore';
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
  Calendar,
  AlertCircle,
  X,
  Check,
  Zap,
  Info
} from 'lucide-react';
import Navbar from '@/components/Navbar';

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
  
  // Zustand Client State
  const { 
    selectedPlanId, 
    setSelectedPlanId, 
    selectedDayIdx, 
    setSelectedDayIdx 
  } = useCoachStore();
  
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

  // Fetch saved plans
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

  // Fallback to latest plan if selectedPlanId is empty or not in lists
  const activePlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  // AI Plan Generation Mutation
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

  // Edit Exercise Mutation
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

  // Delete Plan Mutation
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth?mode=login');
  };

  const saveExerciseEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExercise || !activePlan) return;

    const { dayIdx, exerciseIdx, ...editedValues } = editingExercise;
    const planDataCopy = JSON.parse(JSON.stringify(activePlan.plan_data));
    
    // Apply edited values
    planDataCopy.workout_days[dayIdx].exercises[exerciseIdx] = editedValues;

    updatePlanMutation.mutate(planDataCopy);
  };

  // Safe Index to verify active plan day length
  const safeDayIdx = Math.min(selectedDayIdx, activePlan?.plan_data?.workout_days?.length - 1 || 0);
  const currentDay = activePlan?.plan_data?.workout_days?.[safeDayIdx];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow flex flex-col lg:flex-row w-full max-w-7xl mx-auto px-4 py-8 gap-8">
      
      {/* SIDEBAR */}
      <aside className="w-full lg:w-80 space-y-6 shrink-0">
        
        {/* Profile Card */}
        <div className="rounded-2xl border border-white/10 bg-[#12121a]/85 p-6 shadow-xl backdrop-blur-md space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-emerald-500 to-violet-600 flex items-center justify-center text-white font-bold shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-extrabold text-emerald-400 uppercase tracking-widest">{t('activeMember')}</span>
              <span className="block text-sm text-white truncate font-bold mt-0.5">{userEmail}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
            <div>
              <span className="block text-slate-500 font-extrabold uppercase tracking-widest text-[11px]">{t('goal')}</span>
              <span className="block text-white font-bold mt-1 text-[13px]">
                {tOnboarding(`goals.${initialProfile.goal}`)}
              </span>
            </div>
            <div>
              <span className="block text-slate-500 font-extrabold uppercase tracking-widest text-[11px]">{t('metrics')}</span>
              <span className="block text-white font-bold mt-1 text-[13px]">
                {initialProfile.weight}kg / {initialProfile.height}cm
              </span>
            </div>
            <div>
              <span className="block text-slate-500 font-extrabold uppercase tracking-widest text-[11px]">{t('schedule')}</span>
              <span className="block text-white font-bold mt-1 text-[13px]">
                {initialProfile.training_days} {tOnboarding('schedule.days_unit')}
              </span>
            </div>
            <div>
              <span className="block text-slate-500 font-extrabold uppercase tracking-widest text-[11px]">{t('dietPreference')}</span>
              <span className="block text-white font-bold mt-1 text-[13px] truncate">
                {tOnboarding(`nutrition.${initialProfile.diet_preference}`).split(' (')[0]}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/settings')}
              className="flex-1 border-white/10 hover:bg-white/5 text-xs text-slate-300 font-bold gap-1.5 h-10 rounded-lg"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              {tCommon('settings')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-white/10 hover:bg-red-500/10 hover:text-red-400 text-xs text-slate-300 px-3 h-10 rounded-lg"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Plans List History */}
        <div className="rounded-2xl border border-white/10 bg-[#12121a]/85 p-6 shadow-xl backdrop-blur-md space-y-4">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
            {t('myPlans')}
          </h3>

          {isLoadingPlans ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
            </div>
          ) : plans.length === 0 ? (
            <span className="block text-xs text-slate-500 font-medium">{t('noPlansFound')}</span>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPlanId(p.id);
                    setSelectedDayIdx(0);
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs font-bold transition-all duration-200 ${
                    activePlan?.id === p.id
                      ? 'border-emerald-500 bg-emerald-500/5 text-white'
                      : 'border-white/5 bg-white/[0.01] hover:bg-white/5 text-slate-400'
                  }`}
                >
                  <span className="truncate max-w-[150px]">{p.name}</span>
                  <span className="text-[9px] text-slate-600 font-extrabold uppercase shrink-0">
                    {new Date(p.created_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* AI Generator Action */}
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white font-extrabold h-11 shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 rounded-xl text-xs"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>{t('generating')}</span>
              </>
            ) : (
              <>
                <Plus className="h-4.5 w-4.5" />
                <span>{t('generateNewPlan')}</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Loading overlay */}
        {generateMutation.isPending && (
          <div className="flex-1 flex flex-col justify-center items-center rounded-2xl border border-white/10 bg-[#12121a]/85 p-8 shadow-xl backdrop-blur-md min-h-[400px]">
            <Loader2 className="h-9 w-9 animate-spin text-emerald-400 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">{t('generating')}</h2>
            <p className="text-xs text-slate-400 text-center max-w-sm">
              {t('generatingDesc')}
            </p>
          </div>
        )}

        {/* Empty Active Plan */}
        {!generateMutation.isPending && !activePlan && (
          <div className="flex-1 flex flex-col justify-center items-center rounded-2xl border border-white/10 bg-[#12121a]/85 p-8 shadow-xl backdrop-blur-md min-h-[400px] text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center text-slate-500">
              <Dumbbell className="h-8 w-8 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white">{t('noActivePlanTitle')}</h2>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">{t('noActivePlan')}</p>
            </div>
            <Button
              onClick={() => generateMutation.mutate()}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white font-extrabold h-12 px-8 rounded-xl shadow-lg shadow-emerald-500/10 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              {t('generateNewPlan')}
            </Button>
          </div>
        )}

        {/* Plan display panel */}
        {!generateMutation.isPending && activePlan && (
          <div className="flex-grow space-y-6">
            
            {/* Header controls bar */}
            <div className="rounded-2xl border border-white/10 bg-[#12121a]/85 p-6 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shadow-inner">
                  <Zap className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">{t('activePlan')}</span>
                  <h2 className="text-xl font-black text-white tracking-tight">{activePlan.name}</h2>
                </div>
              </div>

              {/* Workout vs Nutrition Toggle & Trash */}
              <div className="flex items-center gap-2 w-full sm:w-auto self-stretch sm:self-auto">
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 flex-grow sm:flex-grow-0">
                  <button
                    onClick={() => setActiveTab('workout')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
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
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
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
                  className="text-slate-500 hover:text-red-400 p-2.5 h-10 w-10 rounded-xl hover:bg-red-500/5 transition-all shrink-0 border border-white/5 bg-white/[0.01]"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </Button>
              </div>
            </div>

            {/* TAB CONTENT: WORKOUT PLAN */}
            {activeTab === 'workout' && (
              <div className="space-y-6">
                
                {/* Horizontal day selector */}
                <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {activePlan.plan_data.workout_days.map((day: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedDayIdx(idx)}
                      className={`px-5 py-3.5 rounded-xl border text-xs font-black shrink-0 transition-all duration-200 ${
                        selectedDayIdx === idx
                          ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-md'
                          : 'border-white/5 bg-[#12121a]/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {day.day_name}
                    </button>
                  ))}
                </div>

                {/* Exercises list - RENDERED AS INDIVIDUAL CARDS FOR ENHANCED READABILITY */}
                <div className="space-y-4">
                  {/* Focus header banner */}
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-bold text-white">
                        {currentDay?.day_name} - {currentDay?.focus}
                      </span>
                    </div>
                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {currentDay?.exercises.length} Exercises
                    </span>
                  </div>

                  {/* Exercises list */}
                  <div className="grid grid-cols-1 gap-4">
                    {currentDay?.exercises.map((ex: any, idx: number) => (
                      <div 
                        key={idx}
                        className="rounded-2xl border border-white/10 bg-[#12121a]/90 p-5 hover:border-emerald-500/20 transition-all duration-300 shadow-lg space-y-4 relative overflow-hidden group"
                      >
                        {/* Glow effect on hover */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                        {/* Title Header */}
                        <div className="flex items-start justify-between gap-4 relative z-10">
                          <h3 className="text-base sm:text-lg font-black text-white leading-snug flex items-center gap-2">
                            <Dumbbell className="h-5 w-5 text-emerald-400 shrink-0" />
                            {ex.exercise_name}
                          </h3>
                          
                          <Button
                            variant="ghost"
                            onClick={() => setEditingExercise({
                              dayIdx: safeDayIdx,
                              exerciseIdx: idx,
                              ...ex
                            })}
                            className="text-slate-500 hover:text-emerald-400 p-2 h-8 w-8 rounded-lg hover:bg-emerald-500/5 transition-all shrink-0 border border-white/5 bg-white/[0.01]"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Sets, Reps, Rest stats row */}
                        <div className="grid grid-cols-3 gap-3 relative z-10 max-w-sm">
                          {/* Sets */}
                          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-center flex flex-col justify-center min-h-[4.5rem]">
                            <span className="block text-[10px] font-black uppercase tracking-widest text-emerald-400">{t('setsShort')}</span>
                            <span className="block text-base font-black text-white mt-1">{ex.sets}</span>
                          </div>

                          {/* Reps */}
                          <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-3 text-center flex flex-col justify-center min-h-[4.5rem]">
                            <span className="block text-[10px] font-black uppercase tracking-widest text-violet-400">{t('repsShort')}</span>
                            <span className="block text-xs sm:text-sm font-black text-white mt-1 leading-tight break-words">{ex.reps_or_duration}</span>
                          </div>

                          {/* Rest */}
                          <div className="bg-teal-500/5 border border-teal-500/10 rounded-xl p-3 text-center flex flex-col justify-center min-h-[4.5rem]">
                            <span className="block text-[10px] font-black uppercase tracking-widest text-teal-400">{t('restShort')}</span>
                            <span className="block text-base font-black text-white mt-1">{ex.rest_seconds}s</span>
                          </div>
                        </div>

                        {/* Description Notes */}
                        {ex.notes && (
                          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 text-xs text-slate-300 leading-relaxed font-medium flex gap-2 relative z-10">
                            <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{ex.notes}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: NUTRITION PLAN */}
            {activeTab === 'nutrition' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Meal Schedules with distinct side borders */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Breakfast */}
                  <div className="rounded-2xl border-l-4 border-l-emerald-500 border-y border-r border-white/10 bg-[#12121a]/85 p-5 shadow-xl space-y-2 backdrop-blur-md">
                    <span className="block text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                      {t('nutritionMeals.breakfast')}
                    </span>
                    <p className="text-sm text-slate-200 leading-relaxed font-bold">
                      {activePlan.plan_data.nutrition_plan.daily_meal_template.breakfast}
                    </p>
                  </div>

                  {/* Lunch */}
                  <div className="rounded-2xl border-l-4 border-l-violet-500 border-y border-r border-white/10 bg-[#12121a]/85 p-5 shadow-xl space-y-2 backdrop-blur-md">
                    <span className="block text-xs font-extrabold uppercase tracking-widest text-violet-400">
                      {t('nutritionMeals.lunch')}
                    </span>
                    <p className="text-sm text-slate-200 leading-relaxed font-bold">
                      {activePlan.plan_data.nutrition_plan.daily_meal_template.lunch}
                    </p>
                  </div>

                  {/* Dinner */}
                  <div className="rounded-2xl border-l-4 border-l-teal-500 border-y border-r border-white/10 bg-[#12121a]/85 p-5 shadow-xl space-y-2 backdrop-blur-md">
                    <span className="block text-xs font-extrabold uppercase tracking-widest text-teal-400">
                      {t('nutritionMeals.dinner')}
                    </span>
                    <p className="text-sm text-slate-200 leading-relaxed font-bold">
                      {activePlan.plan_data.nutrition_plan.daily_meal_template.dinner}
                    </p>
                  </div>

                  {/* Snacks */}
                  {activePlan.plan_data.nutrition_plan.daily_meal_template.snacks && (
                    <div className="rounded-2xl border-l-4 border-l-amber-500 border-y border-r border-white/10 bg-[#12121a]/85 p-5 shadow-xl space-y-2 backdrop-blur-md">
                      <span className="block text-xs font-extrabold uppercase tracking-widest text-amber-400">
                        {t('nutritionMeals.snacks')}
                      </span>
                      <p className="text-sm text-slate-200 leading-relaxed font-bold">
                        {activePlan.plan_data.nutrition_plan.daily_meal_template.snacks}
                      </p>
                    </div>
                  )}
                </div>

                {/* Macro Target & Nutrition Tips */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Gauge Macros block */}
                  <div className="rounded-2xl border border-white/10 bg-[#12121a]/85 p-6 shadow-xl backdrop-blur-md space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      {t('macroSummary')}
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Calories */}
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                        <span className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">
                          {t('calories')}
                        </span>
                        <span className="block text-2xl font-black text-white mt-1">
                          {activePlan.plan_data.nutrition_plan.target_calories_kcal}
                        </span>
                        <span className="text-[11px] text-slate-500 font-bold">kcal</span>
                      </div>

                      {/* Protein */}
                      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                        <span className="block text-[11px] font-black text-emerald-400 uppercase tracking-wider">
                          {t('protein')}
                        </span>
                        <span className="block text-2xl font-black text-emerald-300 mt-1">
                          {activePlan.plan_data.nutrition_plan.target_protein_g}
                        </span>
                        <span className="text-[11px] text-emerald-500 font-bold">g</span>
                      </div>

                      {/* Carbs */}
                      <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 text-center">
                        <span className="block text-[11px] font-black text-violet-400 uppercase tracking-wider">
                          {t('carbs')}
                        </span>
                        <span className="block text-2xl font-black text-violet-300 mt-1">
                          {activePlan.plan_data.nutrition_plan.target_carbs_g}
                        </span>
                        <span className="text-[11px] text-violet-500 font-bold">g</span>
                      </div>

                      {/* Fat */}
                      <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/10 text-center">
                        <span className="block text-[11px] font-black text-teal-400 uppercase tracking-wider">
                          {t('fat')}
                        </span>
                        <span className="block text-2xl font-black text-teal-300 mt-1">
                          {activePlan.plan_data.nutrition_plan.target_fat_g}
                        </span>
                        <span className="text-[11px] text-teal-500 font-bold">g</span>
                      </div>
                    </div>
                  </div>

                  {/* Tips card */}
                  <div className="rounded-2xl border border-white/10 bg-[#12121a]/85 p-6 shadow-xl backdrop-blur-md space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      {t('generalTips')}
                    </h3>
                    <ul className="space-y-3">
                      {activePlan.plan_data.nutrition_plan.general_tips.map((tip: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-300 font-medium flex items-start gap-2.5 leading-relaxed">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 mt-2" />
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

      {/* EDIT MODAL */}
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
                <div className="space-y-1.5">
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
                  <div className="space-y-1.5">
                    <div className="min-h-[32px] flex items-end">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {t('sets')}
                      </label>
                    </div>
                    <input
                      type="number"
                      value={editingExercise.sets}
                      onChange={(e) => setEditingExercise({ ...editingExercise, sets: parseInt(e.target.value) || 0 })}
                      required
                      className="w-full h-10 px-3.5 rounded-lg border border-white/10 bg-white/5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50 text-center"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="min-h-[32px] flex items-end">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {t('reps')}
                      </label>
                    </div>
                    <input
                      type="text"
                      value={editingExercise.reps_or_duration}
                      onChange={(e) => setEditingExercise({ ...editingExercise, reps_or_duration: e.target.value })}
                      required
                      className="w-full h-10 px-3.5 rounded-lg border border-white/10 bg-white/5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50 text-center"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="min-h-[32px] flex items-end">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {t('rest')}
                      </label>
                    </div>
                    <input
                      type="number"
                      value={editingExercise.rest_seconds}
                      onChange={(e) => setEditingExercise({ ...editingExercise, rest_seconds: parseInt(e.target.value) || 0 })}
                      required
                      className="w-full h-10 px-3.5 rounded-lg border border-white/10 bg-white/5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50 text-center"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {t('notes')}
                  </label>
                  <textarea
                    value={editingExercise.notes || ''}
                    onChange={(e) => setEditingExercise({ ...editingExercise, notes: e.target.value })}
                    rows={2.5}
                    className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50 resize-none leading-relaxed"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={updatePlanMutation.isPending}
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white font-extrabold rounded-lg shadow-lg flex items-center justify-center gap-1.5 text-xs"
                >
                  {updatePlanMutation.isPending ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4.5 w-4.5" />
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
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  {t('deleteConfirm')}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleting(null)}
                  disabled={deletePlanMutation.isPending}
                  className="flex-1 border-white/10 hover:bg-white/5 text-xs text-slate-300 h-10 rounded-lg"
                >
                  {tCommon('cancel')}
                </Button>
                <Button
                  onClick={() => deletePlanMutation.mutate(isDeleting)}
                  disabled={deletePlanMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-10 rounded-lg"
                >
                  {deletePlanMutation.isPending ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin mx-auto" />
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
    </div>
  );
}
