import { applyConfigToProcessEnv, createConfig, resetConfigCache } from '@finance-ai/shared/config'

resetConfigCache()
const config = createConfig()
applyConfigToProcessEnv(config)
console.log('DATABASE_URL:', config.database.url)

const { GET } = await import('../../../apps/dashboard/src/app/api/whatsapp/archive/chats/route.ts')
const response = await GET()
const body = await response.json()
console.log('STATUS:', response.status)
console.log(JSON.stringify(body, null, 2))
