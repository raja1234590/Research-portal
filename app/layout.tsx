import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Research Portal - Financial Statement Extractor',
  description: 'AI-powered financial statement extraction tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
