import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf-8')
}

export const Rc06SpecHarness: Harness = {
  name: 'Rc06SpecHarness',
  async run() {
    const errors: string[] = []
    for (const file of [
      'specs/rc-06-display-names/README.md',
      'specs/rc-06-display-names/acceptance-criteria.md',
      'specs/rc-06-display-names/test-matrix.md',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }
    return createResult(this.name, errors)
  },
}

export const ContactNameResolverHarness: Harness = {
  name: 'ContactNameResolverHarness',
  async run() {
    const errors: string[] = []
    const resolver = read('packages/whatsapp/src/utils/contact-name-resolver.ts')
    if (!resolver.includes('class ContactNameResolver')) {
      errors.push('Missing ContactNameResolver class')
    }
    if (!resolver.includes('contacts.upsert') && !read('packages/whatsapp/src/utils/contact-discovery.ts').includes('contacts.upsert')) {
      errors.push('Missing contacts.upsert listener')
    }
    const discovery = read('packages/whatsapp/src/utils/contact-discovery.ts')
    if (!discovery.includes('attachContactDiscoveryListeners')) {
      errors.push('Missing attachContactDiscoveryListeners')
    }
    return createResult(this.name, errors)
  },
}

export const MapperDisplayNamesHarness: Harness = {
  name: 'MapperDisplayNamesHarness',
  async run() {
    const errors: string[] = []
    const mapper = read('packages/whatsapp/src/utils/baileys-message.util.ts')
    if (!mapper.includes('resolver?: ContactNameResolver')) {
      errors.push('mapBaileysMessage must accept optional resolver')
    }
    if (!mapper.includes('chatName,')) {
      errors.push('mapBaileysMessage must set chatName from resolver')
    }
    return createResult(this.name, errors)
  },
}

export const ApiDisplayNamesHarness: Harness = {
  name: 'ApiDisplayNamesHarness',
  async run() {
    const errors: string[] = []
    const chatsRoute = read('apps/dashboard/src/app/api/whatsapp/archive/chats/route.ts')
    const messagesRoute = read('apps/dashboard/src/app/api/whatsapp/messages/route.ts')
    if (!chatsRoute.includes('getChatIdentityResolver')) {
      errors.push('archive/chats must use ChatIdentityResolver via getChatIdentityResolver')
    }
    if (!messagesRoute.includes('getChatIdentityResolver')) {
      errors.push('messages route must use ChatIdentityResolver via getChatIdentityResolver')
    }
    return createResult(this.name, errors)
  },
}

export const MessageUiDisplayNamesHarness: Harness = {
  name: 'MessageUiDisplayNamesHarness',
  async run() {
    const errors: string[] = []
    const ui = read('apps/dashboard/src/components/messages/message-archive-view.tsx')
    if (ui.includes('displaySenderId')) {
      errors.push('UI must not render displaySenderId')
    }
    if (ui.includes('selectedChat.chatId')) {
      errors.push('UI must not render selectedChat.chatId in header')
    }
    if (ui.includes("chatId.replace(/@.+$/")) {
      errors.push('UI must not use chatId.replace as fallback')
    }
    if (!ui.includes("'Conversa'")) {
      errors.push('UI must use Conversa fallback')
    }
    return createResult(this.name, errors)
  },
}

export const Rc06Harnesses = [
  Rc06SpecHarness,
  ContactNameResolverHarness,
  MapperDisplayNamesHarness,
  ApiDisplayNamesHarness,
  MessageUiDisplayNamesHarness,
]
