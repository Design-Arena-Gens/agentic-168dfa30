import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Happy Wheels Clone - Pogo Stickman',
  description: 'A physics-based game with Pogo Stickman',
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
