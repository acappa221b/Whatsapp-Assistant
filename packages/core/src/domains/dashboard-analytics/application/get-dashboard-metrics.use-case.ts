import type { DashboardAnalyticsRepository } from '../domain/dashboard-analytics.types'

export class GetDashboardMetricsUseCase {
  constructor(private readonly repository: DashboardAnalyticsRepository) {}

  execute(year: number, month: number) {
    return this.repository.getMetrics(year, month)
  }
}
