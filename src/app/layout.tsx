import type { Metadata, Viewport } from 'next'
import './globals.css'
import UpdateNotice from '@/components/UpdateNotice'
import RegisterSW from '@/components/RegisterSW'

// PWA: installable on phones/tablets (manifest + icons + theme color).
export const metadata: Metadata = {
  title: 'EduPlay',
  description: 'K-6 learning platform',
  manifest: '/manifest.json',
  applicationName: 'EduPlay',
  appleWebApp: { capable: true, title: 'EduPlay', statusBarStyle: 'default' },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0F766E',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800&family=Nunito:wght@400;600;700;800;900&family=Press+Start+2P&family=Cinzel+Decorative:wght@400;700&family=Quicksand:wght@500;600;700&family=Manrope:wght@500;600;700;800&family=Baloo+2:wght@600;700&display=swap" rel="stylesheet"/>
        {/* NES.css for Minecraft pixelated UI */}
        <link href="https://unpkg.com/nes.css@2.3.0/css/nes.min.css" rel="stylesheet"/>
      </head>
      <body>{children}<RegisterSW />
        <UpdateNotice /></body>
    </html>
  )
}