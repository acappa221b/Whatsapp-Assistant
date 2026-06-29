import { NextResponse } from 'next/server'
import { listRecentAssistantActions } from '@/lib/assistant/assistant-service'

export async function GET() {
  const items = await listRecentAssistantActions(10)
  return NextResponse.json({
    items: items.map((row) => ({
      id: row.id,
      action: row.action,
      message: row.message,
      createdAt: row.createdAt.toISOString(),
      chatIds: Array.isArray(row.chatIds) ? (row.chatIds as string[]) : [],
    })),
  })
}
