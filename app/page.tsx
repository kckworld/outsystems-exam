export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          OutSystems Exam Trainer
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Master the OutSystems Associate Developer O11 certification
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <a href="/play" className="card hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Practice</h2>
          <p className="text-gray-600">
            Take full exams with complete question sets
          </p>
        </a>

        <a href="/train" className="card hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Custom Training</h2>
          <p className="text-gray-600">
            Focus on specific topics and difficulty levels
          </p>
        </a>

        <a href="/mistakes" className="card hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Mistake Notebook</h2>
          <p className="text-gray-600">
            Review and master your wrong answers
          </p>
        </a>

        <a href="/stats" className="card hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Performance Stats</h2>
          <p className="text-gray-600">
            Track progress toward 70%+ goal
          </p>
        </a>
      </div>

      <div className="card">
        <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Import question sets via <a href="/admin" className="text-primary hover:underline">Admin</a></li>
          <li>Start with <a href="/play" className="text-primary hover:underline">Practice</a> to take full exams</li>
          <li>Check <a href="/stats" className="text-primary hover:underline">Stats</a> to identify weak topics</li>
          <li>Use <a href="/train" className="text-primary hover:underline">Custom Training</a> to focus on problem areas</li>
          <li>Review <a href="/mistakes" className="text-primary hover:underline">Mistakes</a> until auto-archived (2+ correct streaks)</li>
        </ol>
      </div>

      <div className="card bg-blue-50 border border-blue-200">
        <h2 className="text-xl font-semibold mb-2 text-blue-900">70% Goal Tracking</h2>
        <p className="text-blue-800">
          This app helps you identify weak areas and provides targeted practice
          to reach the 70% passing threshold. Check your Stats dashboard regularly
          to see recommended training topics.
        </p>
      </div>

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
