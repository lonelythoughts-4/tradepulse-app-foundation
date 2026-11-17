import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './tokens.css'
import './globals.css'
import './identity.css'
import './activation.css'
import './workspaces.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', display: 'swap' })
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'TradeMemo — Telegram-confirmed trading desk',
  description: 'Review your TradeMemo wallet, bot, and market controls through a secure Telegram-confirmed desk.',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml', sizes: 'any' }],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#f4f1ea',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable}`}>
      <body className="antialiased">
        <Script id="tradepulse-desk-theme" strategy="beforeInteractive">
          {`try{const saved=localStorage.getItem("tradepulse.desk-theme");const theme=saved==="light"||saved==="dark"?saved:"light";document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme}catch{}`}
        </Script>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
