export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') return
  const { installConsoleLogHook } = await import('@/lib/logging/console-hook')
  installConsoleLogHook()
}
