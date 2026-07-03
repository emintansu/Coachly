'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, FileText } from 'lucide-react';

export default function Footer() {
  const t = useTranslations('Landing');
  const tCommon = useTranslations('Common');
  const [modalType, setModalType] = useState<'privacy' | 'terms' | null>(null);

  const getModalContent = () => {
    if (modalType === 'privacy') {
      return {
        title: t('privacyTitle'),
        content: t('privacyContent'),
        icon: <Shield className="h-6 w-6 text-emerald-400" />
      };
    }
    if (modalType === 'terms') {
      return {
        title: t('termsTitle'),
        content: t('termsContent'),
        icon: <FileText className="h-6 w-6 text-violet-400" />
      };
    }
    return null;
  };

  const activeModal = getModalContent();

  return (
    <>
      <footer className="border-t border-white/5 py-8 px-4 text-center text-slate-500 text-xs mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>{t('footerRights', { year: new Date().getFullYear() })}</span>
          <div className="flex gap-4">
            <button
              onClick={() => setModalType('privacy')}
              className="hover:text-slate-300 transition-colors font-medium cursor-pointer bg-transparent border-none focus:outline-none"
            >
              {t('footerPrivacy')}
            </button>
            <button
              onClick={() => setModalType('terms')}
              className="hover:text-slate-300 transition-colors font-medium cursor-pointer bg-transparent border-none focus:outline-none"
            >
              {t('footerTerms')}
            </button>
          </div>
        </div>
      </footer>

      {/* FOOTER INFO MODAL */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalType(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#12121a]/95 p-7 shadow-2xl z-10 max-h-[80vh] flex flex-col space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5 shrink-0">
                <div className="flex items-center gap-2.5">
                  {activeModal.icon}
                  <h3 className="text-lg font-extrabold text-white tracking-tight">
                    {activeModal.title}
                  </h3>
                </div>
                <button
                  onClick={() => setModalType(null)}
                  className="text-slate-500 hover:text-white transition-colors p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto pr-1 flex-grow scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <p className="text-sm text-slate-300/90 leading-relaxed font-semibold whitespace-pre-line text-left">
                  {activeModal.content}
                </p>
              </div>

              <div className="border-t border-white/5 pt-3.5 flex justify-end shrink-0">
                <button
                  onClick={() => setModalType(null)}
                  className="px-6 h-10 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg text-sm transition-colors cursor-pointer"
                >
                  {tCommon('close') || 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
