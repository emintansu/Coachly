import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';
import { Dumbbell } from 'lucide-react';

export default function Navbar() {
  const t = useTranslations('Common');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#09090e]/60 backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
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
          
          <Link
            href="/auth?mode=login"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200"
          >
            {t('login')}
          </Link>
          
          <Link
            href="/auth?mode=signup"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all duration-200"
          >
            {t('signup')}
          </Link>
        </div>
      </div>
    </header>
  );
}
