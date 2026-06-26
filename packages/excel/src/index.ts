export interface WorkbookResult {
  filePath: string
  year: number
  month?: number
}

/** Epic 08 — Excel export (not source of truth) */
export async function generateMonthlyWorkbook(_year: number, _month: number): Promise<WorkbookResult> {
  throw new Error('generateMonthlyWorkbook not implemented — see Epic 08 spec')
}

export async function generateYearWorkbook(_year: number): Promise<WorkbookResult> {
  throw new Error('generateYearWorkbook not implemented — see Epic 08 spec')
}
