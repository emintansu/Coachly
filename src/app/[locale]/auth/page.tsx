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

const authSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  fullName: z.string().optional(),
});

type AuthFormValues = z.infer<typeof authSchema>;

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Auth');
  const tCommon = useTranslations('Common');
  
  // Detect mode: 'login' or 'signup' from query param
  const modeParam = searchParams.get('mode');
  const isLogin = modeParam !== 'signup';
  
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

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
            setError(locale === 'tr' ? 'Giriş yapılamadı: E-posta veya şifre hatalı.' : signInError.message);
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
            setError(locale === 'tr' ? 'Kayıt başarısız: ' + signUpError.message : signUpError.message);
            return;
          }

          if (signUpData.user && !signUpData.session) {
            setSuccessMessage(
              locale === 'tr'
                ? 'Kayıt başarılı! Lütfen e-posta kutunuzu kontrol edin ve gelen onay linkine tıklayın.'
                : 'Registration successful! Please check your inbox and click the verification link.'
            );
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
        setError(err.message || 'Authentication error');
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
    <div className="flex-1 flex flex-col justify-center items-center px-4 relative">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand logo header */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 group mb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-violet-600 shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-transform duration-300">
              <Dumbbell className="h-5.5 w-5.5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent tracking-tight">
              {tCommon('appName')}
            </span>
          </Link>
          <p className="text-slate-400 text-sm font-light">
            {isLogin ? t('welcomeBack') : t('createAccount')}
          </p>
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
                    type="text"
                    {...register('fullName')}
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-white/10 bg-white/5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    placeholder="John Doe"
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
                  type="email"
                  {...register('email')}
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-white/10 bg-white/5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  placeholder="you@example.com"
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
                    type="button"
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    {t('forgotPassword')}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  {...register('password')}
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-white/10 bg-white/5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
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

          {/* Toggle form view link */}
          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <button
              onClick={toggleMode}
              className="text-sm text-slate-400 hover:text-emerald-400 transition-colors duration-200"
            >
              {isLogin ? t('noAccount') : t('hasAccount')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
