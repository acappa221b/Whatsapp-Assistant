import { redirect } from 'next/navigation'

export default function LegacyChatsPage() {
  redirect('/dashboard/permissions')
}
