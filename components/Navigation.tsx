'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Navigation() {
  const { t } = useLanguage();

  return (
    <nav className="bg-white shadow-sm border-b relative">
      <LanguageSwitcher />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <a href="/" className="text-xl font-bold text-primary">
              OutSystems Exam Trainer
            </a>
          </div>
          <div className="flex items-center space-x-4">
            <a href="/play" className="text-gray-700 hover:text-primary">{t('practice')}</a>
            <a href="/train" className="text-gray-700 hover:text-primary">{t('train')}</a>
            <a href="/mistakes" className="text-gray-700 hover:text-primary">{t('mistakes')}</a>
            <a href="/stats" className="text-gray-700 hover:text-primary">{t('stats')}</a>
            <a href="/admin" className="text-gray-700 hover:text-primary">{t('admin')}</a>
          </div>
        </div>
      </div>
    </nav>
  );
}
