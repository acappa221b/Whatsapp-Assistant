import readline from 'node:readline'

export async function promptUpdate(check, options = {}) {
  const timeoutMs = options.timeoutMs ?? 8000
  const local = check.localVersion
  const remote = check.remoteVersion

  console.log('')
  console.log(`Nova versao ${remote} disponivel (voce tem ${local}).`)
  console.log('Seus chats e configuracoes serao preservados.')
  if (check.releaseNotes) {
    console.log(`Novidades: ${check.releaseNotes}`)
  }
  console.log(`Atualizar agora? [S/n] (aguardando ${Math.round(timeoutMs / 1000)}s)`)

  if (!process.stdin.isTTY) {
    return options.defaultYes === false ? 'n' : 's'
  }

  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    let settled = false

    const finish = (answer) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      rl.close()
      resolve(answer.toLowerCase().startsWith('n') ? 'n' : 's')
    }

    const timer = setTimeout(() => finish('s'), timeoutMs)

    rl.question('> ', (answer) => {
      finish(answer.trim() || 's')
    })
  })
}

export function logUserFriendly(message) {
  console.log(message)
}
