import { redirect } from 'next/navigation'

export default function WhatsappPage() {
  redirect('/dashboard/settings?tab=whatsapp')
}
