import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(join(dirname(fileURLToPath(import.meta.url)), '../packages/excel/package.json'))
const ExcelJS = require('exceljs')

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

async function main() {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Catalogo')
  sheet.addRow(['produto', 'plano', 'preco', 'descricao', 'link'])
  sheet.addRow(['Consultoria', 'Mensal', 'R$ 299', 'Acompanhamento mensal', 'https://example.com/consultoria'])
  sheet.addRow(['Plano Basico', 'Mensal', 'R$ 49', 'Ideal para iniciantes', ''])
  sheet.addRow(['Plano Pro', 'Anual', 'R$ 990', 'Recursos avancados', 'https://example.com/pro'])

  const publicPath = join(root, 'apps', 'dashboard', 'public', 'templates', 'catalogo-precos.xlsx')
  const fixturePath = join(root, 'packages', 'excel', 'src', 'fixtures', 'catalogo-precos.xlsx')

  await mkdir(dirname(publicPath), { recursive: true })
  await mkdir(dirname(fixturePath), { recursive: true })

  const buffer = await workbook.xlsx.writeBuffer()
  await writeFile(publicPath, Buffer.from(buffer))
  await writeFile(fixturePath, Buffer.from(buffer))
  console.log('Wrote', publicPath)
}

void main()
