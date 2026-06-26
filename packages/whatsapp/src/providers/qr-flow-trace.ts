/** Instrumentação temporária RC-04 — rastreio ponta a ponta do QR. */

export function traceQrFlow(
  stage: 'baileys' | 'provider' | 'api-status' | 'api-sse' | 'api-connect',
  event: string,
  payload: Record<string, unknown>,
): void {
  console.info(`[rc04/trace] ${stage} :: ${event}`, {
    at: new Date().toISOString(),
    ...payload,
  })
}
