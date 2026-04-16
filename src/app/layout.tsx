import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EduPlay',
  description: 'Fun K-6 learning platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EduPlay',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-512.png' },
    ],
    shortcut: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#4A7FD4',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Press+Start+2P&family=Cinzel+Decorative:wght@400;700&family=Quicksand:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Favicon — uses your real logo */}
        <link rel="icon" href="/icons/icon-512.png" type="image/png" />
        <link rel="shortcut icon" href="/icons/icon-512.png" />
        {/* PWA / iOS */}
        <link rel="apple-touch-icon" href="/icons/icon-512.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EduPlay" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#4A7FD4" />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
