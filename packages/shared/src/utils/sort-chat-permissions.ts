import { formatChatListLabel } from './chat-display-id'

export type SortColumn =
  | 'name'
  | 'archiveEnabled'
  | 'agentChatEnabled'
  | 'audioProcessingEnabled'
  | 'photoProcessingEnabled'
  | 'reportGenerationEnabled'

export type SortDirection = 'asc' | 'desc'
export type SortState = { column: SortColumn | null; direction: SortDirection | null }

export type SortableChatRow = {
  chatId: string
  displayNumber: number
  name: string | null
  archiveEnabled: boolean
  agentChatEnabled: boolean
  audioProcessingEnabled: boolean
  photoProcessingEnabled: boolean
  reportGenerationEnabled: boolean
}

export function cycleSortState(
  current: SortState,
  column: SortColumn,
  isBoolean: boolean,
): SortState {
  if (current.column !== column) {
    return { column, direction: isBoolean ? 'desc' : 'asc' }
  }
  if (current.direction === (isBoolean ? 'desc' : 'asc')) {
    return { column, direction: isBoolean ? 'asc' : 'desc' }
  }
  return { column: null, direction: null }
}

export function sortChats<T extends SortableChatRow>(rows: T[], sort: SortState): T[] {
  if (!sort.column || !sort.direction) return rows

  const dir = sort.direction === 'asc' ? 1 : -1
  const indexed = rows.map((row, index) => ({ row, index }))

  indexed.sort((a, b) => {
    if (sort.column === 'name') {
      const numCmp = a.row.displayNumber - b.row.displayNumber
      if (numCmp !== 0) return numCmp * dir
      const normalize = (value: string | null) =>
        (value ?? '')
          .normalize('NFD')
          .replace(/\p{M}/gu, '')
          .toLowerCase()
          .trim()
      const la = normalize(a.row.name)
      const lb = normalize(b.row.name)
      return la.localeCompare(lb, 'pt-BR', { sensitivity: 'base' }) * dir
    }

    const col = sort.column as Exclude<SortColumn, 'name'>
    const va = a.row[col] ? 1 : 0
    const vb = b.row[col] ? 1 : 0
    if (va !== vb) return (va - vb) * dir
    return a.row.displayNumber - b.row.displayNumber
  })

  return indexed.map((entry) => entry.row)
}

export function filterChatsBySearch<T extends SortableChatRow>(rows: T[], query: string): T[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return rows
  return rows.filter((row) => {
    const label = formatChatListLabel(row.displayNumber, row.name).toLowerCase()
    const numberToken = `#${row.displayNumber}`
    return label.includes(normalized) || numberToken.includes(normalized) || row.chatId.toLowerCase().includes(normalized)
  })
}
