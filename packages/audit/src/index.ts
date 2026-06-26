export interface AuditEntry {
  entity: string
  entityId?: string
  action: string
  actorId?: string
  before?: unknown
  after?: unknown
}

export interface AuditService {
  log(entry: AuditEntry): Promise<void>
}

/** Epic 10 — Audit trail */
export class PrismaAuditService implements AuditService {
  async log(_entry: AuditEntry): Promise<void> {
    throw new Error('PrismaAuditService.log not implemented — see Epic 10 spec')
  }
}
