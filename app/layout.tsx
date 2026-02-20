import './globals.css'
import type { Metadata } from 'next'
import { LanguageProvider } from '@/lib/i18n/LanguageProvider'
import { Navigation } from '@/components/Navigation'

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
        <LanguageProvider>
          <Navigation />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  )
}
