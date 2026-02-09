import type { Metadata } from 'next'
import { IBM_Plex_Sans } from 'next/font/google'
import './globals.css'
import { IframeLoggerInit } from '@/components/IframeLoggerInit'

const ibmPlexSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'VibeSplit - The Ultimate Valentine Experience',
  description: 'Gamified dual-mode Valentine/Anti-Valentine AI experience',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={ibmPlexSans.className}>
        <IframeLoggerInit />
        {children}
      </body>
    </html>
  )
}
