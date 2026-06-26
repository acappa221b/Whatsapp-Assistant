import type { OCRProvider } from './ocr.provider'

/** OpenAI Vision OCR — Epic 07 */
export class OpenAIVisionOCRProvider implements OCRProvider {
  async extractText(
    _input: { filePath: string } | { buffer: Buffer; mimeType: string },
  ): Promise<string> {
    throw new Error('OpenAIVisionOCRProvider.extractText not implemented — see Epic 06 spec')
  }
}
