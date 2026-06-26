import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ValidationError } from '@finance-ai/shared/errors'
import { InMemoryWhatsappMediaRegistry, MediaDownloader } from './media-downloader'

describe('MediaDownloader', () => {
  function createDownloader() {
    const dir = mkdtempSync(join(tmpdir(), 'media-downloader-'))
    const registry = new InMemoryWhatsappMediaRegistry()
    const downloader = new MediaDownloader(registry, dir, 1024 * 1024)
    return {
      registry,
      downloader,
      cleanup: () => rmSync(dir, { recursive: true, force: true }),
    }
  }

  it('validates supported mime types', () => {
    const { downloader, cleanup } = createDownloader()
    expect(downloader.validateMimeType('image/jpeg', 'IMAGE')).toBe('image/jpeg')
    expect(() => downloader.validateMimeType('text/plain', 'DOCUMENT')).toThrow(ValidationError)
    cleanup()
  })

  it('prevents path traversal when generating storage path', () => {
    const { downloader, cleanup } = createDownloader()
    expect(() => downloader.generateStoragePath('msg-1', 'image/jpeg', '../evil.jpg')).toThrow(
      ValidationError,
    )
    cleanup()
  })

  it('saves valid pdf media', async () => {
    const { downloader, cleanup } = createDownloader()
    const buffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n', 'utf-8')
    const stored = await downloader.saveMedia(buffer, 'application/pdf', 'invoice.pdf', 'msg-1')
    expect(stored.storagePath).toContain('invoice.pdf')
    cleanup()
  })

  it('rejects empty files', async () => {
    const { downloader, cleanup } = createDownloader()
    await expect(
      downloader.saveMedia(Buffer.alloc(0), 'application/pdf', 'empty.pdf', 'msg-1'),
    ).rejects.toThrow(ValidationError)
    cleanup()
  })

  it('rejects corrupted jpeg files', async () => {
    const { downloader, cleanup } = createDownloader()
    await expect(
      downloader.saveMedia(Buffer.from('not-a-jpeg'), 'image/jpeg', 'receipt.jpg', 'msg-1'),
    ).rejects.toThrow(/Corrupted JPEG file/)
    cleanup()
  })

  it('fails download when source is missing from registry', async () => {
    const { downloader, cleanup } = createDownloader()
    await expect(
      downloader.downloadImage({
        externalMessageId: 'missing',
        mimeType: 'image/jpeg',
        fileName: 'receipt.jpg',
      }),
    ).rejects.toThrow(/Media source not found/)
    cleanup()
  })
})
