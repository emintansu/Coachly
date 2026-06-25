'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  Loader2, 
  Save, 
  Scale, 
  Target, 
  Calendar, 
  Apple,
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const profileSchema = z.object({
  goal: z.enum(['lose_weight', 'gain_muscle', 'maintain']),
  height: z.coerce.number().min(100).max(250),
  weight: z.coerce.number().min(30).max(300),
  age: z.coerce.number().min(10).max(100),
  activity_level: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active']),
  training_days: z.coerce.number().min(1).max(7),
  equipment: z.enum(['none', 'dumbbells', 'full_gym']),
  diet_preference: z.enum(['standard', 'vegetarian', 'vegan', 'keto', 'high_protein']),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const t = useTranslations('Onboarding');
  const tSettings = useTranslations('Settings');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema) as any,
  });

  const selectedGoal = watch('goal');
  const selectedActivity = watch('activity_level');
  const selectedEquipment = watch('equipment');
  const selectedDiet = watch('diet_preference');
  const selectedDays = watch('training_days');

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth?mode=login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
      } else if (profile) {
        reset({
          goal: profile.goal || 'gain_muscle',
          height: profile.height || 175,
          weight: profile.weight || 70,
          age: profile.age || 25,
          activity_level: profile.activity_level || 'moderately_active',
          training_days: profile.training_days || 3,
          equipment: profile.equipment || 'dumbbells',
          diet_preference: profile.diet_preference || 'standard',
        });
      }
      setLoading(false);
    }
    loadProfile();
  }, [router, supabase, reset]);

  const onSubmit = async (values: ProfileValues) => {
    setSaving(false);
    setMessage(null);
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          goal: values.goal,
          height: values.height,
          weight: values.weight,
          age: values.age,
          activity_level: values.activity_level,
          training_days: values.training_days,
          equipment: values.equipment,
          diet_preference: values.diet_preference,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setMessage({ type: 'success', text: tSettings('saveSuccess') });
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage({ type: 'error', text: tSettings('saveError') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 relative">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Back and Title */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            {tSettings('backToDashboard')}
          </Button>

          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-emerald-400" />
            {tSettings('title')}
          </h1>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`flex items-start gap-2.5 p-4 rounded-xl border ${
            message.type === 'success' 
              ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200' 
              : 'border-red-500/30 bg-red-500/5 text-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Unified Form Panel */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Goal selection (left side) */}
            <div className="rounded-2xl border border-white/10 bg-[#12121a]/80 p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2 pb-2 border-b border-white/5">
                <Target className="h-4 w-4 text-emerald-400" />
                {t('goals.title')}
              </h2>
              
              <div className="space-y-3">
                {['lose_weight', 'gain_muscle', 'maintain'].map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setValue('goal', goal as any)}
                    className={`w-full flex justify-between items-center p-3 rounded-lg border text-left text-xs font-semibold transition-all duration-200 ${
                      selectedGoal === goal
                        ? 'border-emerald-500 bg-emerald-500/5 text-white'
                        : 'border-white/5 bg-white/[0.01] hover:bg-white/5 text-slate-400'
                    }`}
                  >
                    <span>{t(`goals.${goal}`)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics (right side) */}
            <div className="rounded-2xl border border-white/10 bg-[#12121a]/80 p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2 pb-2 border-b border-white/5">
                <Scale className="h-4 w-4 text-emerald-400" />
                {t('metrics.title')}
              </h2>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('metrics.age')}</label>
                  <input
                    type="number"
                    {...register('age')}
                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('metrics.height')}</label>
                  <input
                    type="number"
                    {...register('height')}
                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('metrics.weight')}</label>
                  <input
                    type="number"
                    {...register('weight')}
                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('metrics.activity')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {['sedentary', 'lightly_active', 'moderately_active', 'very_active'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setValue('activity_level', level as any)}
                      className={`p-2 rounded-lg border text-left text-[11px] font-medium transition-all duration-200 ${
                        selectedActivity === level
                          ? 'border-emerald-500 bg-emerald-500/5 text-white'
                          : 'border-white/5 bg-white/[0.01] hover:bg-white/5 text-slate-400'
                      }`}
                    >
                      {t(`metrics.${level}`).split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Schedule (bottom left) */}
            <div className="rounded-2xl border border-white/10 bg-[#12121a]/80 p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2 pb-2 border-b border-white/5">
                <Calendar className="h-4 w-4 text-emerald-400" />
                {t('schedule.title')}
              </h2>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('schedule.days')}</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setValue('training_days', day)}
                      className={`flex-1 h-9 rounded-lg border text-center font-bold text-xs transition-all duration-200 ${
                        selectedDays === day
                          ? 'border-emerald-500 bg-emerald-500/5 text-emerald-400'
                          : 'border-white/5 bg-white/[0.01] hover:bg-white/5 text-slate-400'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('schedule.equipment')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {['none', 'dumbbells', 'full_gym'].map((eq) => (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => setValue('equipment', eq as any)}
                      className={`p-2 rounded-lg border text-center transition-all duration-200 ${
                        selectedEquipment === eq
                          ? 'border-emerald-500 bg-emerald-500/5 text-emerald-400'
                          : 'border-white/5 bg-white/[0.01] hover:bg-white/5 text-slate-400'
                      }`}
                    >
                      <span className="block text-[11px] font-bold text-white">{t(`schedule.eq_${eq}`).split(' (')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Nutrition (bottom right) */}
            <div className="rounded-2xl border border-white/10 bg-[#12121a]/80 p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2 pb-2 border-b border-white/5">
                <Apple className="h-4 w-4 text-emerald-400" />
                {t('nutrition.title')}
              </h2>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('nutrition.diet')}</label>
                <div className="grid grid-cols-1 gap-2">
                  {['standard', 'vegetarian', 'vegan', 'keto', 'high_protein'].map((diet) => (
                    <button
                      key={diet}
                      type="button"
                      onClick={() => setValue('diet_preference', diet as any)}
                      className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all duration-200 ${
                        selectedDiet === diet
                          ? 'border-emerald-500 bg-emerald-500/5 text-white'
                          : 'border-white/5 bg-white/[0.01] hover:bg-white/5 text-slate-400'
                      }`}
                    >
                      {t(`nutrition.${diet}`).split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Action button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white font-bold h-11 px-8 rounded-lg shadow-lg flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {tCommon('save')}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
