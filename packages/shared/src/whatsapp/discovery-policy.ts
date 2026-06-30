export type WhatsappDiscoveryPolicy = {
  syncGroupsEnabled: boolean
  syncAddressBookEnabled: boolean
  syncChatsMetadataEnabled: boolean
}

export const DEFAULT_WHATSAPP_DISCOVERY_POLICY: WhatsappDiscoveryPolicy = {
  syncGroupsEnabled: false,
  syncAddressBookEnabled: false,
  syncChatsMetadataEnabled: false,
}

export function isGroupChatId(chatId: string): boolean {
  return chatId.endsWith('@g.us')
}
