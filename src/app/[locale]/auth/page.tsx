'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dumbbell, Mail, Lock, User, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';

// Define shape statically for TypeScript types
const staticAuthSchema = z.object({
  email: z.string(),
  password: z.string(),
  fullName: z.string().optional(),
});

type AuthFormValues = z.infer<typeof staticAuthSchema>;

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Auth');
  const tCommon = useTranslations('Common');
  
  // Dynamic validation schema using translations
  const authSchema = z.object({
    email: z.string().email({ message: t('validation.emailInvalid') }),
    password: z.string().min(6, { message: t('validation.passwordMinLength') }),
    fullName: z.string().optional(),
  });

  // Detect mode: 'login' or 'signup' from query param
  const modeParam = searchParams.get('mode');
  const isLogin = modeParam !== 'signup';
  
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  // Forgot password modal states
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPending, setResetPending] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);
    if (!resetEmail) {
      setResetError(t('validation.emailInvalid'));
      return;
    }
    setResetPending(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + `/${locale}/auth/callback?type=recovery`,
      });
      if (resetErr) {
        setResetError(resetErr.message);
      } else {
        setResetSuccess(t('status.resetSuccess') || 'Password reset link sent! Check your inbox.');
      }
    } catch (err: any) {
      setResetError(err.message || 'An error occurred');
    } finally {
      setResetPending(false);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
    },
  });

  const onSubmit = async (values: AuthFormValues) => {
    setError(null);
    setSuccessMessage(null);
    
    startTransition(async () => {
      try {
        if (isLogin) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password,
          });
          
          if (signInError) {
            setError(t('status.loginFailed'));
            return;
          }
        } else {
          // Sign up
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: {
              data: {
                full_name: values.fullName || '',
              },
            },
          });
          
          if (signUpError) {
            setError(t('status.signupFailed', { message: signUpError.message }));
            return;
          }

          if (signUpData.user && !signUpData.session) {
            setSuccessMessage(t('status.signupSuccess'));
            return;
          }
        }
        
        // Check if user profile already has onboarding data
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('goal')
            .eq('id', user.id)
            .single();
            
          if (profile && profile.goal) {
            // User already completed onboarding
            router.push('/dashboard');
          } else {
            // Fresh user, send to onboarding
            router.push('/onboarding');
          }
        }
      } catch (err: any) {
        setError(err.message || t('status.authError'));
      }
    });
  };

  const toggleMode = () => {
    setError(null);
    setSuccessMessage(null);
    reset();
    router.push(isLogin ? '/auth?mode=signup' : '/auth?mode=login');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <div className="flex-grow flex flex-col justify-center items-center px-4 py-12 relative">
        {/* Background decorations */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Card header */}
          <div className="flex flex-col items-center mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {isLogin ? t('welcomeBack') : t('createAccount')}
            </h1>
          </div>

          {/* Card wrapper */}
          <div className="rounded-2xl border border-white/10 bg-[#12121a]/80 p-8 shadow-2xl backdrop-blur-md">
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 mb-6 rounded-xl border border-red-500/30 bg-red-500/5 text-red-200 text-sm">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-start gap-2.5 p-3.5 mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-200 text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Full Name (Sign Up only) */}
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {t('fullName')}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      id="auth-fullname-input"
                      type="text"
                      {...register('fullName')}
                      className="w-full h-11 pl-10 pr-4 rounded-lg border border-white/10 bg-white/5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      placeholder={t('fullNamePlaceholder')}
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t('email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    id="auth-email-input"
                    type="email"
                    {...register('email')}
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-white/10 bg-white/5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    placeholder={t('emailPlaceholder')}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {t('password')}
                  </label>
                  {isLogin && (
                    <button
                      id="auth-forgot-password-btn"
                      type="button"
                      onClick={() => {
                        setResetEmail('');
                        setResetError(null);
                        setResetSuccess(null);
                        setIsResetModalOpen(true);
                      }}
                      className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      {t('forgotPassword')}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    id="auth-password-input"
                    type="password"
                    {...register('password')}
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-white/10 bg-white/5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    placeholder={t('passwordPlaceholder')}
                    required
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                id="auth-submit-btn"
                type="submit"
                disabled={isPending}
                className="w-full h-11 mt-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isLogin ? (
                  tCommon('login')
                ) : (
                  tCommon('signup')
                )}
              </Button>
            </form>

            {/* Toggle Mode */}
            <div className="mt-6 text-center">
              <button
                id="auth-toggle-mode-btn"
                type="button"
                onClick={toggleMode}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                {isLogin ? t('noAccount') : t('hasAccount')}
              </button>
            </div>
          </div>
        </div>

        {/* PASSWORD RESET MODAL */}
        <AnimatePresence>
          {isResetModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsResetModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#161622] p-6 shadow-2xl z-10 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="text-base font-bold text-white">
                    {t('forgotPasswordTitle')}
                  </h3>
                  <button
                    onClick={() => {
                      setIsResetModalOpen(false);
                      setResetError(null);
                      setResetSuccess(null);
                    }}
                    className="text-slate-500 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {resetError && (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-red-200 text-xs">
                    <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
                    <span>{resetError}</span>
                  </div>
                )}

                {resetSuccess && (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-emerald-200 text-xs">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{resetSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    {t('forgotPasswordDesc')}
                  </p>
                  <div className="space-y-1.5">
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder={t('emailPlaceholder')}
                      className="w-full h-10 px-3.5 rounded-lg border border-white/10 bg-white/5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={resetPending}
                    className="w-full h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-1.5 text-xs animate-pulse"
                  >
                    {resetPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t('sendResetLink')
                    )}
                  </Button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
