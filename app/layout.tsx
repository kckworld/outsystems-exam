import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OutSystems Exam Trainer',
  description: 'Practice and master OutSystems Associate Developer O11 certification',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <a href="/" className="text-xl font-bold text-primary">
                  OutSystems Exam Trainer
                </a>
              </div>
              <div className="flex items-center space-x-4">
                <a href="/play" className="text-gray-700 hover:text-primary">Practice</a>
                <a href="/train" className="text-gray-700 hover:text-primary">Train</a>
                <a href="/mistakes" className="text-gray-700 hover:text-primary">Mistakes</a>
                <a href="/stats" className="text-gray-700 hover:text-primary">Stats</a>
                <a href="/admin" className="text-gray-700 hover:text-primary">Admin</a>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
