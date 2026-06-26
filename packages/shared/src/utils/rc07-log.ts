type Rc07Channel = 'PARSER' | 'WRAPPER' | 'CONTACT' | 'IMAGE' | 'PERSIST' | 'BACKFILL' | 'AUDIO'

export function logRc07(
  channel: Rc07Channel,
  payload: Record<string, unknown>,
): void {
  console.info(`[RC07/${channel}]`, {
    at: new Date().toISOString(),
    ...payload,
  })
}
