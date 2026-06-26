'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import LanguageSwitcher from './LanguageSwitcher';
import { Dumbbell, LogOut } from 'lucide-react';

export default function Navbar() {
  const t = useTranslations('Common');
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (err) {
        console.error('Error fetching auth session:', err);
      } finally {
        setLoading(false);
      }
    }
    getSession();

    // Listen for auth state changes to dynamically update login status
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth?mode=login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#09090e]/60 backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link id="nav-logo-link" href="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-violet-600 shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-transform duration-300">
            <Dumbbell className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent tracking-tight">
            {t('appName')}
          </span>
        </Link>

        {/* Action buttons */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          
          {!loading && (
            user ? (
              <button
                id="nav-logout-btn"
                onClick={handleLogout}
                className="text-sm font-semibold text-slate-300 hover:text-red-400 flex items-center gap-1.5 transition-colors duration-200 bg-transparent border-none cursor-pointer focus:outline-none"
              >
                <LogOut className="h-4 w-4" />
                <span>{t('logout')}</span>
              </button>
            ) : (
              <>
                <Link
                  id="nav-login-link"
                  href="/auth?mode=login"
                  className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200"
                >
                  {t('login')}
                </Link>
                
                <Link
                  id="nav-signup-link"
                  href="/auth?mode=signup"
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all duration-200"
                >
                  {t('signup')}
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </header>
  );
}
