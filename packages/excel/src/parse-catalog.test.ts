import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseExcelCatalog } from './parse-catalog'

describe('parseExcelCatalog', () => {
  it('parses catalog fixture xlsx', async () => {
    const buffer = readFileSync(join(import.meta.dirname, 'fixtures', 'catalogo-precos.xlsx'))
    const { rows } = await parseExcelCatalog(buffer)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0]?.produto).toBeTruthy()
    expect(rows[0]?.preco).toBeTruthy()
  })
})
