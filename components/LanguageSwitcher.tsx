'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2 bg-white rounded-lg shadow-md p-2 border border-gray-200">
      <button
        onClick={() => setLanguage('ko')}
        className={`px-3 py-1 rounded transition-colors ${
          language === 'ko'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        한국어
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 rounded transition-colors ${
          language === 'en'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        English
      </button>
    </div>
  );
}
