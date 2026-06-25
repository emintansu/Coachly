'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLanguage = () => {
    const nextLocale = locale === 'tr' ? 'en' : 'tr';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <Button
      id="language-switcher-btn"
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors duration-200"
    >
      <Globe className="h-4 w-4 text-emerald-400" />
      <span className="text-xs font-semibold uppercase tracking-wider">
        {locale === 'tr' ? 'EN' : 'TR'}
      </span>
    </Button>
  );
}
