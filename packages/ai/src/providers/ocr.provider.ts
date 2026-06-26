export interface OCRProvider {
  extractText(input: { filePath: string } | { buffer: Buffer; mimeType: string }): Promise<string>
}
