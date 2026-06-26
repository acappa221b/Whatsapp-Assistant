/** RC-09 — safe directory slug: `{slug}_{chatIdSuffix}` */
export function buildChatDirName(displayName: string, chatId: string): string {
  const slug =
    displayName
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'chat'
  const suffix = chatId.replace(/@.+$/, '').slice(-8)
  return `${slug}_${suffix}`
}
