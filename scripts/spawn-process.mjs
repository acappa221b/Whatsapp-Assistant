import { spawn } from 'node:child_process'

function isWindowsCmdScript(command) {
  const lower = command.toLowerCase()
  return lower.endsWith('.cmd') || lower.endsWith('.bat')
}

/**
 * Spawn a child process with a cwd-safe strategy on Windows.
 * .cmd/.bat cannot run with shell:false (https://nodejs.org/api/child_process.html#spawning-bat-and-cmd-files-on-windows
 * shell:true with UNC cwd fails — callers must set WA_APP_ROOT via pushd first.
 */
export function spawnProcess(command, args, opts = {}) {
  if (process.platform === 'win32' && isWindowsCmdScript(command)) {
    return spawn('cmd.exe', ['/d', '/s', '/c', command, ...args], {
      ...opts,
      shell: false,
    })
  }

  const useShell =
    process.platform === 'win32' &&
    !command.toLowerCase().endsWith('.exe') &&
    !isWindowsCmdScript(command)

  return spawn(command, args, { ...opts, shell: useShell })
}

export { isWindowsCmdScript }
