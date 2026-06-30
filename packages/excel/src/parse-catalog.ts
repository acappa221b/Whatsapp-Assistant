import ExcelJS from 'exceljs'

export type CatalogRow = {
  produto: string
  plano: string
  preco: string
  descricao: string
  link?: string
}

const PRODUCT_KEYS = ['produto', 'servico', 'nome', 'item', 'product']
const PLAN_KEYS = ['plano', 'tier', 'modalidade']
const PRICE_KEYS = ['preco', 'preço', 'valor', 'price']
const DESC_KEYS = ['descricao', 'descrição', 'desc', 'detalhe']
const LINK_KEYS = ['link', 'url']

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function pickColumn(headers: string[], keys: string[]): number {
  return headers.findIndex((header) => keys.includes(header))
}

export async function parseExcelCatalog(buffer: Buffer): Promise<{ rows: CatalogRow[] }> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer)
  const sheet = workbook.worksheets[0]
  if (!sheet) return { rows: [] }

  const headerRow = sheet.getRow(1)
  const headers: string[] = []
  headerRow.eachCell((cell, col) => {
    headers[col - 1] = normalizeHeader(String(cell.value ?? ''))
  })

  const produtoCol = pickColumn(headers, PRODUCT_KEYS)
  const planoCol = pickColumn(headers, PLAN_KEYS)
  const precoCol = pickColumn(headers, PRICE_KEYS)
  const descCol = pickColumn(headers, DESC_KEYS)
  const linkCol = pickColumn(headers, LINK_KEYS)

  const rows: CatalogRow[] = []
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const produto = produtoCol >= 0 ? String(row.getCell(produtoCol + 1).value ?? '').trim() : ''
    if (!produto) return
    rows.push({
      produto,
      plano: planoCol >= 0 ? String(row.getCell(planoCol + 1).value ?? '').trim() : '',
      preco: precoCol >= 0 ? String(row.getCell(precoCol + 1).value ?? '').trim() : '',
      descricao: descCol >= 0 ? String(row.getCell(descCol + 1).value ?? '').trim() : '',
      link: linkCol >= 0 ? String(row.getCell(linkCol + 1).value ?? '').trim() : undefined,
    })
  })

  return { rows }
}

export function parseCsvCatalog(text: string): { rows: CatalogRow[] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return { rows: [] }
  const headers = lines[0]!.split(/[,;]/).map(normalizeHeader)
  const produtoCol = pickColumn(headers, PRODUCT_KEYS)
  const planoCol = pickColumn(headers, PLAN_KEYS)
  const precoCol = pickColumn(headers, PRICE_KEYS)
  const descCol = pickColumn(headers, DESC_KEYS)
  const linkCol = pickColumn(headers, LINK_KEYS)

  const rows: CatalogRow[] = []
  for (const line of lines.slice(1)) {
    const cells = line.split(/[,;]/).map((cell) => cell.trim())
    const produto = produtoCol >= 0 ? (cells[produtoCol] ?? '') : ''
    if (!produto) continue
    rows.push({
      produto,
      plano: planoCol >= 0 ? (cells[planoCol] ?? '') : '',
      preco: precoCol >= 0 ? (cells[precoCol] ?? '') : '',
      descricao: descCol >= 0 ? (cells[descCol] ?? '') : '',
      link: linkCol >= 0 ? (cells[linkCol] ?? '') : undefined,
    })
  }
  return { rows }
}

export function catalogRowsToSearchText(rows: CatalogRow[]): string {
  return rows
    .map((row) =>
      [row.produto, row.plano, row.preco, row.descricao, row.link].filter(Boolean).join(' | '),
    )
    .join('\n')
}
