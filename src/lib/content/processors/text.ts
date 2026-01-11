/**
 * Text file processor (txt, md)
 */

export interface TextExtractionResult {
  text: string
  metadata: {
    sourceFileName: string
    fileType: string
    characterCount: number
  }
}

export async function extractTextFromFile(
  file: File | Buffer,
  fileName: string
): Promise<TextExtractionResult> {
  let text: string

  if (file instanceof File) {
    text = await file.text()
  } else {
    text = file.toString('utf-8')
  }

  const fileType = fileName.endsWith('.md') || fileName.endsWith('.markdown')
    ? 'markdown'
    : 'text'

  return {
    text: text.trim(),
    metadata: {
      sourceFileName: fileName,
      fileType,
      characterCount: text.length,
    },
  }
}
