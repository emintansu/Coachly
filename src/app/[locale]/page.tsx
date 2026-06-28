import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Sparkles,
  Dumbbell,
  Apple,
  Flame,
  Target,
  Compass,
  CheckCircle2
} from 'lucide-react';

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('Landing');
  const tCommon = await getTranslations('Common');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col justify-center px-4 pt-16 pb-20 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left Text Column */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/5 text-violet-300 text-xs font-medium tracking-wide">
              <Sparkles className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
              <span>Personalized AI Coaching Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              {t('title').split('AI').map((part, idx) => (
                idx === 1 ? (
                  <span key={idx}>
                    <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-violet-500 bg-clip-text text-transparent">AI</span>
                    {part}
                  </span>
                ) : part
              ))}
            </h1>

            <p className="text-lg text-slate-400 max-w-2xl font-light leading-relaxed">
              {t('subtitle')}
            </p>

            <div className="flex flex-wrap gap-4 pt-2 w-full sm:w-auto">
              <Link
                id="landing-signup-btn"
                href="/auth?mode=signup"
                className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 text-sm font-bold text-white shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:brightness-110 active:scale-98 transition-all duration-200"
              >
                {t('ctaStart')}
              </Link>

              <Link
                id="landing-login-btn"
                href="/auth?mode=login"
                className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-8 text-sm font-bold text-slate-200 hover:bg-white/10 hover:text-white active:scale-98 transition-all duration-200"
              >
                {tCommon('login')}
              </Link>
            </div>

            {/* Quick Metrics Badges */}
            <div className="grid grid-cols-3 gap-6 pt-8 w-full border-t border-white/5">
              <div>
                <span className="block text-2xl font-bold text-white tracking-tight">100%</span>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Kişiye Özel / Custom</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-emerald-400 tracking-tight">Flash</span>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Hızlı AI / Gemini AI</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-white tracking-tight">2 Dilli</span>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">TR / EN Desteği</span>
              </div>
            </div>
          </div>

          {/* Right Visual Teaser Column */}
          <div className="lg:col-span-5 relative w-full flex justify-center items-center">
            {/* Glowing background circles for visual depth */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Mockup Glass Card */}
            <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#12121a]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs text-slate-400 font-semibold tracking-wide uppercase">AI Active Plan</span>
                </div>
                <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">TR & EN</span>
              </div>

              <div className="space-y-4">
                {/* Onboarding Summary Mock */}
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Onboarding Profile</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs font-semibold text-white">Kas Yapma / Gain Muscle</span>
                    <span className="text-xs text-slate-300">4 Gün / 4 Days</span>
                  </div>
                </div>

                {/* Day 1 Detail Mock */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400">Pazartesi / Monday: Göğüs & Triceps</span>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all duration-300">
                      <div className="flex items-center gap-2">
                        <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-xs font-medium text-white">Bench Press</span>
                      </div>
                      <span className="text-xs text-slate-400">4 Set x 10 Reps</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all duration-300">
                      <div className="flex items-center gap-2">
                        <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-xs font-medium text-white">Dumbbell Flyes</span>
                      </div>
                      <span className="text-xs text-slate-400">3 Set x 12 Reps</span>
                    </div>
                  </div>
                </div>

                {/* Nutrition Tip Mock */}
                <div className="border-t border-white/5 pt-4">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1 rounded bg-violet-500/10 text-violet-400 mt-0.5">
                      <Apple className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-white">Beslenme / Nutrition Tip</span>
                      <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
                        Yüksek proteinli kahvaltı şablonu (Yumurta, Yulaf ezmesi, Lor peyniri).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t border-white/5 bg-[#09090d]/50 py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              {t('features')}
            </h2>
            <div className="h-1 w-20 bg-gradient-to-r from-emerald-500 to-violet-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group rounded-2xl border border-white/5 bg-[#12121a]/40 p-8 shadow-lg hover:border-emerald-500/20 hover:bg-[#12121a]/60 transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Flame className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t('aiWorkout')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{t('aiWorkoutDesc')}</p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl border border-white/5 bg-[#12121a]/40 p-8 shadow-lg hover:border-emerald-500/20 hover:bg-[#12121a]/60 transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Apple className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t('dietSupport')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{t('dietSupportDesc')}</p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl border border-white/5 bg-[#12121a]/40 p-8 shadow-lg hover:border-emerald-500/20 hover:bg-[#12121a]/60 transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Compass className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t('interactive')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{t('interactiveDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4 text-center text-slate-500 text-xs mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} Coachly. Tüm hakları saklıdır. / All rights reserved.</span>
          <div className="flex gap-4">
            <span className="hover:text-slate-300 cursor-pointer">Gizlilik Politikası</span>
            <span className="hover:text-slate-300 cursor-pointer">Kullanım Koşulları</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
