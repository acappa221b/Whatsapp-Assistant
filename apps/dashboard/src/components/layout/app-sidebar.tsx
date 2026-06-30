'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Route } from 'next'
import { cn } from '@/lib/utils'
import { useAppVersion } from '@/hooks/use-app-version'

const NAV_ITEMS = [
  { href: '/dashboard/permissions', label: 'Permissões', accent: 'green' as const },
  { href: '/dashboard/assistant', label: 'Chat IA', accent: 'pink' as const },
  { href: '/dashboard', label: 'Dashboard', accent: 'orange' as const },
  { href: '/dashboard/messages', label: 'Mensagens', accent: 'pink' as const },
  { href: '/dashboard/multi-mensagem', label: 'Multi Mensagem', accent: 'green' as const },
  { href: '/dashboard/reports', label: 'Relatórios', accent: 'orange' as const },
  { href: '/dashboard/settings', label: 'Configurações', accent: 'orange' as const },
] as const

const accentStyles = {
  orange: 'border-neon-orange/50 text-neon-orange shadow-[0_0_12px_hsl(var(--neon-orange)/0.25)]',
  pink: 'border-neon-pink/50 text-neon-pink shadow-[0_0_12px_hsl(var(--neon-pink)/0.25)]',
  green: 'border-neon-green/50 text-neon-green shadow-[0_0_12px_hsl(var(--neon-green)/0.25)]',
} as const

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname.startsWith(href)
}

export function AppSidebar() {
  const pathname = usePathname()
  const { data: versionInfo } = useAppVersion()

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border/60 bg-card/40 backdrop-blur-sm">
      <div className="border-b border-border/60 px-5 py-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Assistant
        </p>
        <h1 className="mt-1 bg-gradient-to-r from-neon-orange via-neon-pink to-neon-green bg-clip-text text-lg font-bold text-transparent">
          WhatsApp
        </h1>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href as Route}
              className={cn(
                'rounded-md border border-transparent px-3 py-2.5 text-sm font-medium transition-all',
                'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                active && accentStyles[item.accent],
                active && 'bg-muted/20',
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-border/60 px-5 py-4">
        <p className="font-mono text-xs text-muted-foreground">
          v{versionInfo?.version ?? '…'}
        </p>
      </div>
    </aside>
  )
}
