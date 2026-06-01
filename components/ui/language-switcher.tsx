'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/src/i18n/navigation';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: 'en' | 'es') => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div
      className={`flex items-center gap-0.5 rounded-lg bg-[var(--neu-bg)] p-1 shadow-[inset_2px_2px_4px_var(--neu-shadow-dark),inset_-2px_-2px_4px_var(--neu-shadow-light)] ${className}`}
    >
      <button
        onClick={() => switchLocale('es')}
        aria-label="Cambiar a Español"
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all duration-150 ${
          locale === 'es'
            ? 'bg-[var(--neu-accent)] text-white shadow-[1px_1px_3px_var(--neu-shadow-dark)]'
            : 'text-[var(--neu-text-secondary)] hover:text-[var(--neu-text)]'
        }`}
      >
        ES
      </button>
      <button
        onClick={() => switchLocale('en')}
        aria-label="Switch to English"
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all duration-150 ${
          locale === 'en'
            ? 'bg-[var(--neu-accent)] text-white shadow-[1px_1px_3px_var(--neu-shadow-dark)]'
            : 'text-[var(--neu-text-secondary)] hover:text-[var(--neu-text)]'
        }`}
      >
        EN
      </button>
    </div>
  );
}
