'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Dumbbell, 
  ChevronRight, 
  ChevronLeft, 
  Loader2, 
  Flame, 
  Target, 
  Activity,
  Award,
  Scale,
  Calendar,
  Apple
} from 'lucide-react';

// Validation Schema using Zod
const onboardingSchema = z.object({
  goal: z.enum(['lose_weight', 'gain_muscle', 'maintain']),
  height: z.coerce.number().min(100, 'Height must be at least 100 cm').max(250, 'Height must be below 250 cm'),
  weight: z.coerce.number().min(30, 'Weight must be at least 30 kg').max(300, 'Weight must be below 300 kg'),
  age: z.coerce.number().min(10, 'Age must be at least 10').max(100, 'Age must be below 100'),
  activity_level: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active']),
  training_days: z.coerce.number().min(1).max(7),
  equipment: z.enum(['none', 'dumbbells', 'full_gym']),
  diet_preference: z.enum(['standard', 'vegetarian', 'vegan', 'keto', 'high_protein']),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const t = useTranslations('Onboarding');
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const totalSteps = 4;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema) as any,
    mode: 'onChange',
    defaultValues: {
      goal: 'gain_muscle',
      height: 175,
      weight: 70,
      age: 25,
      activity_level: 'moderately_active',
      training_days: 3,
      equipment: 'dumbbells',
      diet_preference: 'standard',
    },
  });

  const selectedGoal = watch('goal');
  const selectedActivity = watch('activity_level');
  const selectedEquipment = watch('equipment');
  const selectedDiet = watch('diet_preference');
  const selectedDays = watch('training_days');

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth?mode=login');
      } else {
        // If user already completed onboarding, skip directly to dashboard
        const { data: profile } = await supabase
          .from('profiles')
          .select('goal')
          .eq('id', user.id)
          .single();

        if (profile?.goal) {
          router.push('/dashboard');
        } else {
          setLoadingUser(false);
        }
      }
    }
    checkUser();
  }, [router, supabase]);

  const onSubmit = async (values: OnboardingValues) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No active user');

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
      
      router.push('/dashboard');
    } catch (err) {
      console.error('Error saving profile:', err);
      alert(locale === 'tr' ? 'Profil kaydedilirken hata oluştu.' : 'Error saving profile.');
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  if (loadingUser) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  // Slide animations config
  const slideVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.2 } },
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 relative">
      {/* Background neon glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 flex flex-col items-center">
        {/* Onboarding Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl mb-2">
            {t('title')}
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Multi-step Container */}
        <div className="w-full rounded-2xl border border-white/10 bg-[#12121a]/90 p-8 shadow-2xl backdrop-blur-md">
          {/* Progress bar */}
          <div className="w-full mb-8">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <span>{t('step', { current: step, total: totalSteps })}</span>
              <span className="text-emerald-400">{Math.round((step / totalSteps) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-violet-600 transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 min-h-[300px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {/* STEP 1: GOALS */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Target className="h-5 w-5 text-emerald-400" />
                    {t('goals.title')}
                  </h2>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Goal Card 1 */}
                    <button
                      type="button"
                      onClick={() => setValue('goal', 'lose_weight', { shouldValidate: true })}
                      className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                        selectedGoal === 'lose_weight'
                          ? 'border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/5'
                          : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                      }`}
                    >
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                        <Flame className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-white mb-1">{t('goals.lose_weight')}</span>
                        <span className="block text-xs text-slate-400 leading-normal">{t('goals.lose_weight_desc')}</span>
                      </div>
                    </button>

                    {/* Goal Card 2 */}
                    <button
                      type="button"
                      onClick={() => setValue('goal', 'gain_muscle', { shouldValidate: true })}
                      className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                        selectedGoal === 'gain_muscle'
                          ? 'border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/5'
                          : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                      }`}
                    >
                      <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-400 mt-0.5">
                        <Dumbbell className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-white mb-1">{t('goals.gain_muscle')}</span>
                        <span className="block text-xs text-slate-400 leading-normal">{t('goals.gain_muscle_desc')}</span>
                      </div>
                    </button>

                    {/* Goal Card 3 */}
                    <button
                      type="button"
                      onClick={() => setValue('goal', 'maintain', { shouldValidate: true })}
                      className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                        selectedGoal === 'maintain'
                          ? 'border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/5'
                          : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                      }`}
                    >
                      <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5">
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-white mb-1">{t('goals.maintain')}</span>
                        <span className="block text-xs text-slate-400 leading-normal">{t('goals.maintain_desc')}</span>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: METRICS */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Scale className="h-5 w-5 text-emerald-400" />
                    {t('metrics.title')}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Age Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {t('metrics.age')}
                      </label>
                      <input
                        type="number"
                        {...register('age')}
                        className="w-full h-11 px-4 rounded-lg border border-white/10 bg-white/5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500/50"
                      />
                      {errors.age && (
                        <p className="text-xs text-red-400">{errors.age.message}</p>
                      )}
                    </div>

                    {/* Height Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {t('metrics.height')}
                      </label>
                      <input
                        type="number"
                        {...register('height')}
                        className="w-full h-11 px-4 rounded-lg border border-white/10 bg-white/5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500/50"
                      />
                      {errors.height && (
                        <p className="text-xs text-red-400">{errors.height.message}</p>
                      )}
                    </div>

                    {/* Weight Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {t('metrics.weight')}
                      </label>
                      <input
                        type="number"
                        {...register('weight')}
                        className="w-full h-11 px-4 rounded-lg border border-white/10 bg-white/5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500/50"
                      />
                      {errors.weight && (
                        <p className="text-xs text-red-400">{errors.weight.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Activity Level Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {t('metrics.activity')}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {['sedentary', 'lightly_active', 'moderately_active', 'very_active'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setValue('activity_level', level as any, { shouldValidate: true })}
                          className={`p-3 rounded-lg border text-left text-xs font-medium transition-all duration-200 ${
                            selectedActivity === level
                              ? 'border-emerald-500 bg-emerald-500/5 text-white'
                              : 'border-white/5 bg-white/[0.01] hover:bg-white/5 text-slate-400'
                          }`}
                        >
                          {t(`metrics.${level}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: SCHEDULE & EQUIPMENT */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-emerald-400" />
                    {t('schedule.title')}
                  </h2>

                  {/* Days Selector */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {t('schedule.days')}
                    </label>
                    <div className="flex gap-2.5">
                      {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setValue('training_days', day, { shouldValidate: true })}
                          className={`flex-1 h-11 rounded-lg border text-center font-bold text-sm transition-all duration-200 ${
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

                  {/* Equipment Selector */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {t('schedule.equipment')}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {['none', 'dumbbells', 'full_gym'].map((eq) => (
                        <button
                          key={eq}
                          type="button"
                          onClick={() => setValue('equipment', eq as any, { shouldValidate: true })}
                          className={`p-4 rounded-xl border text-center transition-all duration-200 ${
                            selectedEquipment === eq
                              ? 'border-emerald-500 bg-emerald-500/5 text-emerald-400 shadow-md'
                              : 'border-white/5 bg-white/[0.01] hover:bg-white/5 text-slate-400'
                          }`}
                        >
                          <span className="block text-xs font-bold text-white">{t(`schedule.eq_${eq}`)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: NUTRITION */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Apple className="h-5 w-5 text-emerald-400" />
                    {t('nutrition.title')}
                  </h2>

                  {/* Diet Type Selector */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {t('nutrition.diet')}
                    </label>
                    <div className="grid grid-cols-1 gap-2.5">
                      {['standard', 'vegetarian', 'vegan', 'keto', 'high_protein'].map((diet) => (
                        <button
                          key={diet}
                          type="button"
                          onClick={() => setValue('diet_preference', diet as any, { shouldValidate: true })}
                          className={`p-3.5 rounded-lg border text-left text-sm font-semibold transition-all duration-200 ${
                            selectedDiet === diet
                              ? 'border-emerald-500 bg-emerald-500/5 text-white'
                              : 'border-white/5 bg-white/[0.01] hover:bg-white/5 text-slate-400'
                          }`}
                        >
                          {t(`nutrition.${diet}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-white/5 mt-8">
              <Button
                type="button"
                variant="ghost"
                onClick={prevStep}
                disabled={step === 1 || saving}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('back')}
              </Button>

              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white font-bold"
                >
                  {t('next')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={saving || !isValid}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white font-bold"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('finish')
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
