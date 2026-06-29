import { AppSidebar } from '@/components/layout/app-sidebar'
import { WhatsappHeaderStatus } from '@/components/whatsapp/whatsapp-header-status'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-border/60 px-6 py-3">
          <p className="text-sm text-muted-foreground">WhatsApp Assistant</p>
          <WhatsappHeaderStatus />
        </header>
        <main className="wa-scroll min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</main>
      </div>
    </div>
  )
}
