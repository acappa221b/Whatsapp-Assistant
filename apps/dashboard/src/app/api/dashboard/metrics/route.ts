import { NextResponse } from 'next/server'
import { prisma, DashboardAnalyticsPrismaRepository } from '@finance-ai/database'
import { GetDashboardMetricsUseCase } from '@finance-ai/core/domains/dashboard-analytics'
import { mapRepositoryError } from '@/lib/api-error'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const now = new Date()
    const year = Number(url.searchParams.get('year') ?? now.getFullYear())
    const month = Number(url.searchParams.get('month') ?? now.getMonth() + 1)

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Invalid year or month' }, { status: 400 })
    }

    const useCase = new GetDashboardMetricsUseCase(new DashboardAnalyticsPrismaRepository(prisma))
    const metrics = await useCase.execute(year, month)
    return NextResponse.json(metrics)
  } catch (error) {
    const mapped = mapRepositoryError(error)
    if (mapped) return mapped
    console.error('[dashboard/metrics]', error)
    return NextResponse.json({ error: 'Failed to load dashboard metrics' }, { status: 500 })
  }
}
