import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EduPlay — K-6 Learning Platform',
  description: 'Fun, game-like learning for kids in grades K-6',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Press+Start+2P&family=Cinzel+Decorative:wght@400;700&family=Quicksand:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
