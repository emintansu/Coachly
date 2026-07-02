'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  ChevronRight, 
  ChevronLeft, 
  Flame, 
  Dumbbell, 
  Award,
  ChevronLast
} from 'lucide-react';

const onboardingBaseSchema = z.object({
  goal: z.enum(['lose_weight', 'gain_muscle', 'maintain']),
  height: z.coerce.number(),
  weight: z.coerce.number(),
  age: z.coerce.number(),
  activity_level: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active']),
  training_days: z.coerce.number(),
  equipment: z.enum(['none', 'dumbbells', 'full_gym']),
  diet_preference: z.enum(['standard', 'vegetarian', 'vegan', 'keto', 'high_protein']),
});

type OnboardingValues = z.infer<typeof onboardingBaseSchema>;

export default function OnboardingPage() {
  const t = useTranslations('Onboarding');
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const totalSteps = 8;

  const onboardingSchema = useMemo(() => {
    return z.object({
      goal: z.enum(['lose_weight', 'gain_muscle', 'maintain']),
      height: z.coerce.number()
        .min(100, t('validation.heightMin'))
        .max(250, t('validation.heightMax')),
      weight: z.coerce.number()
        .min(30, t('validation.weightMin'))
        .max(300, t('validation.weightMax')),
      age: z.coerce.number()
        .min(15, t('validation.ageMin'))
        .max(100, t('validation.ageMax')),
      activity_level: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active']),
      training_days: z.coerce.number().min(1).max(7),
      equipment: z.enum(['none', 'dumbbells', 'full_gym']),
      diet_preference: z.enum(['standard', 'vegetarian', 'vegan', 'keto', 'high_protein']),
    });
  }, [t]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
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
      diet_preference: undefined as any,
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
    if (step < totalSteps) return;
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
      console.error(err);
      alert(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  // Custom step validator before moving next
  const handleNext = async () => {
    let isValidStep = false;
    if (step === 1) isValidStep = await trigger('goal');
    else if (step === 2) isValidStep = await trigger('age');
    else if (step === 3) isValidStep = await trigger('height');
    else if (step === 4) isValidStep = await trigger('weight');
    else if (step === 5) isValidStep = await trigger('activity_level');
    else if (step === 6) isValidStep = await trigger('training_days');
    else if (step === 7) isValidStep = await trigger('equipment');
    else if (step === 8) isValidStep = await trigger('diet_preference');

    if (isValidStep && step < totalSteps) {
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

  const slideVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.2 } },
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 relative">
      {/* Background neon glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl relative z-10 flex flex-col items-center">
        
        {/* Progress header */}
        <div className="w-full mb-6">
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

        {/* Form Box */}
        <div className="w-full rounded-2xl border border-white/10 bg-[#12121a]/95 p-8 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 min-h-[340px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              
              {/* STEP 1: GOAL */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {t('goals.title')}
                    </h2>
                    <p className="text-xs text-slate-400">{t('subtitle')}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5">
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

              {/* STEP 2: AGE */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="space-y-4">
                      <h3 className="text-xl font-bold text-white">
                        {t('metrics.age_question')}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {t('metrics.age_desc')}
                      </p>
                    </div>

                  <div className="flex flex-col items-center py-6">
                    <div className="relative max-w-[200px] w-full text-center">
                      <input
                        type="number"
                        {...register('age')}
                        autoFocus
                        className="w-full text-center text-5xl font-black bg-transparent border-b-2 border-white/10 hover:border-white/20 focus:border-emerald-500 focus:outline-none pb-2 text-white placeholder-slate-800"
                        placeholder="25"
                      />
                    </div>
                    {errors.age && (
                      <p className="text-xs text-red-400 mt-3 text-center">{errors.age.message}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 3: HEIGHT */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="space-y-4">
                      <h3 className="text-xl font-bold text-white">
                        {t('metrics.height_question')}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {t('metrics.height_desc')}
                      </p>
                    </div>

                  <div className="flex flex-col items-center py-6">
                    <div className="relative max-w-[200px] w-full text-center flex items-end justify-center">
                      <input
                        type="number"
                        {...register('height')}
                        autoFocus
                        className="w-full text-center text-5xl font-black bg-transparent border-b-2 border-white/10 hover:border-white/20 focus:border-emerald-500 focus:outline-none pb-2 text-white placeholder-slate-800"
                        placeholder="175"
                      />
                      <span className="text-xl font-bold text-slate-500 ml-2 mb-2">cm</span>
                    </div>
                    {errors.height && (
                      <p className="text-xs text-red-400 mt-3 text-center">{errors.height.message}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 4: WEIGHT */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="space-y-4">
                      <h3 className="text-xl font-bold text-white">
                        {t('metrics.weight_question')}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {t('metrics.weight_desc')}
                      </p>
                    </div>

                  <div className="flex flex-col items-center py-6">
                    <div className="relative max-w-[200px] w-full text-center flex items-end justify-center">
                      <input
                        type="number"
                        {...register('weight')}
                        autoFocus
                        className="w-full text-center text-5xl font-black bg-transparent border-b-2 border-white/10 hover:border-white/20 focus:border-emerald-500 focus:outline-none pb-2 text-white placeholder-slate-800"
                        placeholder="70"
                      />
                      <span className="text-xl font-bold text-slate-500 ml-2 mb-2">kg</span>
                    </div>
                    {errors.weight && (
                      <p className="text-xs text-red-400 mt-3 text-center">{errors.weight.message}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 5: ACTIVITY LEVEL */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="space-y-4">
                      <h3 className="text-xl font-bold text-white">{t('metrics.activity')}</h3>
                      <p className="text-slate-400 text-sm">
                        {t('metrics.activity_question')}
                      </p>
                    </div>

                  <div className="grid grid-cols-1 gap-3">
                    {['sedentary', 'lightly_active', 'moderately_active', 'very_active'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setValue('activity_level', level as any, { shouldValidate: true })}
                        className={`p-4 rounded-xl border text-left text-sm font-semibold transition-all duration-200 ${
                          selectedActivity === level
                            ? 'border-emerald-500 bg-emerald-500/5 text-white shadow-md'
                            : 'border-white/5 bg-white/[0.02] hover:bg-white/5 text-slate-400'
                        }`}
                      >
                        {t(`metrics.${level}`)}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 6: WEEKLY DAYS */}
              {step === 6 && (
                <motion.div
                  key="step6"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="space-y-4">
                      <h3 className="text-xl font-bold text-white">
                        {t('schedule.days_question')}
                      </h3>
                    </div>

                  <div className="flex justify-center py-6">
                    <div className="flex flex-wrap justify-center gap-3 max-w-[340px]">
                      {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setValue('training_days', day, { shouldValidate: true })}
                          className={`h-14 w-14 rounded-full border text-center font-black text-base transition-all duration-200 ${
                            selectedDays === day
                              ? 'border-emerald-500 bg-emerald-500/5 text-emerald-400 shadow-md'
                              : 'border-white/5 bg-white/[0.02] hover:bg-white/5 text-slate-400'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 7: EQUIPMENT */}
              {step === 7 && (
                <motion.div
                  key="step7"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="space-y-4 pt-6 border-t border-white/5">
                      <h3 className="text-xl font-bold text-white">
                        {t('schedule.equipment_question')}
                      </h3>
                    </div>

                  <div className="grid grid-cols-1 gap-3.5">
                    {['none', 'dumbbells', 'full_gym'].map((eq) => (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => setValue('equipment', eq as any, { shouldValidate: true })}
                        className={`p-5 rounded-xl border text-center transition-all duration-200 ${
                          selectedEquipment === eq
                            ? 'border-emerald-500 bg-emerald-500/5 text-emerald-400 shadow-md'
                            : 'border-white/5 bg-white/[0.02] hover:bg-white/5 text-slate-400'
                        }`}
                      >
                        <span className="block text-sm font-extrabold text-white">{t(`schedule.eq_${eq}`)}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 8: DIET PREFERENCE */}
              {step === 8 && (
                <motion.div
                  key="step8"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="space-y-4">
                      <h3 className="text-xl font-bold text-white">{t('nutrition.title')}</h3>
                      <p className="text-slate-400 text-sm">
                        {t('nutrition.diet_question')}
                      </p>
                    </div>

                  <div className="grid grid-cols-1 gap-3">
                    {['standard', 'vegetarian', 'vegan', 'keto', 'high_protein'].map((diet) => (
                      <button
                        key={diet}
                        type="button"
                        onClick={() => setValue('diet_preference', diet as any, { shouldValidate: true })}
                        className={`p-4 rounded-xl border text-left text-sm font-semibold transition-all duration-200 ${
                          selectedDiet === diet
                            ? 'border-emerald-500 bg-emerald-500/5 text-white shadow-md'
                            : 'border-white/5 bg-white/[0.02] hover:bg-white/5 text-slate-400'
                        }`}
                      >
                        {t(`nutrition.${diet}`)}
                      </button>
                    ))}
                  </div>

                  {errors.diet_preference && (
                    <p className="text-xs text-red-400 text-center mt-2">
                      {t('nutrition.diet_error')}
                    </p>
                  )}
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
                  key="next-btn"
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white font-bold h-11 px-6 rounded-lg"
                >
                  {t('next')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  key="finish-btn"
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white font-bold h-11 px-6 rounded-lg shadow-lg"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {t('finish')}
                      <ChevronLast className="h-4 w-4" />
                    </>
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
