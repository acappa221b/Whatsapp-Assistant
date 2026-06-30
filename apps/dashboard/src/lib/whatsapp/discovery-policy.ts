import type { PrismaClient } from '@finance-ai/database'
import {
  DEFAULT_WHATSAPP_DISCOVERY_POLICY,
  type WhatsappDiscoveryPolicy,
} from '@finance-ai/shared'

export async function loadWhatsappDiscoveryPolicy(
  prisma: PrismaClient,
): Promise<WhatsappDiscoveryPolicy> {
  const settings = await prisma.appSettings.findUnique({ where: { id: 'default' } })
  if (!settings) return DEFAULT_WHATSAPP_DISCOVERY_POLICY
  return {
    syncGroupsEnabled: settings.syncGroupsEnabled,
    syncAddressBookEnabled: settings.syncAddressBookEnabled,
    syncChatsMetadataEnabled: settings.syncChatsMetadataEnabled,
  }
}
