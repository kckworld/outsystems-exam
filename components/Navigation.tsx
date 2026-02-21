'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

export function Navigation() {
  const { t, language, setLanguage } = useLanguage();

  return (
    <nav className="bg-white shadow-sm border-b">
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
            
            {/* Language Switcher */}
            <div className="flex gap-2 ml-4 pl-4 border-l border-gray-300">
              <button
                onClick={() => setLanguage('ko')}
                className={`px-3 py-1 rounded transition-colors text-sm ${
                  language === 'ko'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                한국어
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded transition-colors text-sm ${
                  language === 'en'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
