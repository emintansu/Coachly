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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Dumbbell, Mail, Lock, User, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

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
  
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  // Forgot password modal states
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPending, setResetPending] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error(t('validation.emailInvalid'));
      return;
    }
    setResetPending(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + `/${locale}/auth/callback?type=recovery`,
      });
      if (resetErr) {
        toast.error(resetErr.message);
      } else {
        toast.success(t('status.resetSuccess') || 'Password reset link sent! Check your inbox.');
        setIsResetModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
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
    startTransition(async () => {
      try {
        if (isLogin) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password,
          });
          
          if (signInError) {
            toast.error(t('status.loginFailed'));
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
            toast.error(t('status.signupFailed', { message: signUpError.message }));
            return;
          }

          if (signUpData.user && !signUpData.session) {
            toast.success(t('status.signupSuccess'));
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
        toast.error(err.message || t('status.authError'));
      }
    });
  };

  const toggleMode = () => {
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Full Name (Sign Up only) */}
              {!isLogin && (
                <div className="space-y-1.5 text-left">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {t('fullName')}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />
                    <Input
                      id="auth-fullname-input"
                      type="text"
                      {...register('fullName')}
                      className="h-11 pl-10 border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 focus-visible:border-emerald-500/50 focus-visible:ring-0"
                      placeholder={t('fullNamePlaceholder')}
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t('email')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />
                  <Input
                    id="auth-email-input"
                    type="email"
                    {...register('email')}
                    className="h-11 pl-10 border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 focus-visible:border-emerald-500/50 focus-visible:ring-0"
                    placeholder={t('emailPlaceholder')}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {t('password')}
                  </Label>
                  {isLogin && (
                    <button
                      id="auth-forgot-password-btn"
                      type="button"
                      onClick={() => {
                        setResetEmail('');
                        setIsResetModalOpen(true);
                      }}
                      className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      {t('forgotPassword')}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />
                  <Input
                    id="auth-password-input"
                    type="password"
                    {...register('password')}
                    className="h-11 pl-10 border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 focus-visible:border-emerald-500/50 focus-visible:ring-0"
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
                className="w-full h-11 mt-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2 border-none"
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
                className="text-xs text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
              >
                {isLogin ? t('noAccount') : t('hasAccount')}
              </button>
            </div>
          </div>
        </div>

        {/* PASSWORD RESET DIALOG */}
        <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
          <DialogContent className="max-w-sm rounded-2xl border border-white/10 bg-[#161622] p-6 shadow-2xl space-y-4 text-left">
            <DialogHeader className="border-b border-white/5 pb-3">
              <DialogTitle className="text-base font-bold text-white text-left">
                {t('forgotPasswordTitle')}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <DialogDescription className="text-xs text-slate-400 leading-relaxed font-semibold text-left">
                {t('forgotPasswordDesc')}
              </DialogDescription>
              
              <div className="space-y-1.5">
                <Input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  className="h-10 px-3.5 border-white/10 bg-white/5 text-slate-100 text-xs focus-visible:border-emerald-500/50 focus-visible:ring-0"
                />
              </div>

              <Button
                type="submit"
                disabled={resetPending}
                className="w-full h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-1.5 text-xs border-none"
              >
                {resetPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('sendResetLink')
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
