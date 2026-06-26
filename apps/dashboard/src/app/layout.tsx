import type { Metadata } from 'next'
import { JetBrains_Mono, Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'WhatsApp Assistant',
  description: 'Memória conversacional via WhatsApp — captura, organização e transcrição',
  applicationName: 'WhatsApp Assistant',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} ${jetbrains.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
