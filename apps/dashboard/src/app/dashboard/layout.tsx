import { AppSidebar } from '@/components/layout/app-sidebar'
import { WhatsappHeaderStatus } from '@/components/whatsapp/whatsapp-header-status'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border/60 px-8 py-4">
          <p className="text-sm text-muted-foreground">WhatsApp Assistant</p>
          <WhatsappHeaderStatus />
        </header>
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  )
}
