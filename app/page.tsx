'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t('homeTitle')}
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          {t('homeDescription')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <a href="/play" className="card hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">{t('practiceCard.title')}</h2>
          <p className="text-gray-600">
            {t('practiceCard.description')}
          </p>
        </a>

        <a href="/train" className="card hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">{t('trainCard.title')}</h2>
          <p className="text-gray-600">
            {t('trainCard.description')}
          </p>
        </a>

        <a href="/mistakes" className="card hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">{t('mistakesCard.title')}</h2>
          <p className="text-gray-600">
            {t('mistakesCard.description')}
          </p>
        </a>

        <a href="/stats" className="card hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">{t('statsCard.title')}</h2>
          <p className="text-gray-600">
            {t('statsCard.description')}
          </p>
        </a>
      </div>

      <div className="card">
        <h2 className="text-2xl font-semibold mb-4">{t('gettingStarted')}</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>{t('gettingStartedSteps.0')}</li>
          <li>{t('gettingStartedSteps.1')}</li>
          <li>{t('gettingStartedSteps.2')}</li>
          <li>{t('gettingStartedSteps.3')}</li>
          <li>{t('gettingStartedSteps.4')}</li>
        </ol>
      </div>

      <div className="card bg-blue-50 border border-blue-200">
        <p className="text-blue-800">
          <strong>{t('tipTitle')}</strong> {t('tipDescription')}
        </p>
      </div>
    </div>
  );
}

      <div className="card">
        <h2 className="text-2xl font-semibold mb-4">Features</h2>
        <ul className="space-y-2 text-gray-700">
          <li>✓ Flexible question import (with or without set metadata)</li>
          <li>✓ Question-by-question practice with immediate feedback</li>
          <li>✓ Custom training filters (topic, difficulty, question count)</li>
          <li>✓ Smart mistake tracking with auto-archive (2 correct = mastered)</li>
          <li>✓ Comprehensive stats by set, topic, and difficulty</li>
          <li>✓ Keyboard shortcuts for efficient practice</li>
          <li>✓ Copy questions to clipboard for AI assistance</li>
          <li>✓ Progress auto-save and resume</li>
        </ul>
      </div>
    </div>
  )
}
