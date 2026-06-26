import type { NextConfig } from 'next'
import { createConfig, createConfigWithOverrides } from '../../packages/shared/src/config'

const sharedConfig = (() => {
  try {
    return createConfig()
  } catch {
    return createConfigWithOverrides({
      OPENAI_API_KEY: 'next-config-placeholder',
    })
  }
})()

const nextConfig: NextConfig = {
  ...(sharedConfig.app.dockerBuild ? { output: 'standalone' as const } : {}),
  env: {
    APP_VERSION: sharedConfig.app.version,
    DATABASE_URL: sharedConfig.database.url,
    MEDIA_STORAGE_PATH: sharedConfig.storage.mediaPath,
    TEMP_STORAGE_PATH: sharedConfig.storage.tempPath,
    WHATSAPP_SESSION_PATH: sharedConfig.whatsapp.sessionPath,
    BACKUP_PATH: sharedConfig.storage.backupPath,
    OPENAI_API_KEY: sharedConfig.openai.apiKey,
    OPENAI_MODEL: sharedConfig.openai.model,
  },
  serverExternalPackages: [
    '@whiskeysockets/baileys',
    'ws',
    'bufferutil',
    'utf-8-validate',
    'sharp',
    'pino',
    'qrcode',
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve = config.resolve ?? {}
      config.resolve.alias = {
        ...config.resolve.alias,
        // Evita stub webpack que quebra ws (bufferUtil.mask is not a function).
        bufferutil: false,
        'utf-8-validate': false,
      }

      const serverExternals = [
        'ws',
        'bufferutil',
        'utf-8-validate',
        '@whiskeysockets/baileys',
        'sharp',
        'pino',
        'qrcode',
      ]
      if (Array.isArray(config.externals)) {
        config.externals.push(...serverExternals)
      } else if (config.externals) {
        config.externals = [config.externals, ...serverExternals]
      } else {
        config.externals = serverExternals
      }
    }
    return config
  },
  transpilePackages: [
    '@finance-ai/core',
    '@finance-ai/shared',
    '@finance-ai/database',
    '@finance-ai/whatsapp',
    '@finance-ai/ai',
    '@finance-ai/excel',
    '@finance-ai/audit',
  ],
  typedRoutes: true,
}

export default nextConfig
