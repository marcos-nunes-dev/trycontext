/**
 * Content processors - extract text from various file types
 */

import { extractTextFromFile, type TextExtractionResult } from './text'
import { extractTextFromTranscript, type TranscriptExtractionResult } from './transcript'
import { extractTextFromPDF, type PDFExtractionResult } from './pdf'

export type ExtractionResult = TextExtractionResult | TranscriptExtractionResult | PDFExtractionResult

export interface ProcessorOptions {
  fileName: string
  fileType: 'transcription' | 'document' | 'image'
}

/**
 * Extract text from a file based on its type and extension
 */
export async function extractText(
  file: File | Buffer,
  options: ProcessorOptions
): Promise<ExtractionResult> {
  const { fileName, fileType } = options
  const lowerFileName = fileName.toLowerCase()

  // Determine processor based on file extension and type
  if (fileType === 'transcription') {
    // SRT or VTT files
    if (lowerFileName.endsWith('.srt') || lowerFileName.endsWith('.vtt')) {
      return extractTextFromTranscript(file, fileName)
    }
    // Fallback to text extraction for other transcription formats
    return extractTextFromFile(file, fileName)
  }

  if (fileType === 'document') {
    // PDF files
    if (lowerFileName.endsWith('.pdf')) {
      return extractTextFromPDF(file, fileName)
    }
    // Text/markdown files
    if (
      lowerFileName.endsWith('.txt') ||
      lowerFileName.endsWith('.md') ||
      lowerFileName.endsWith('.markdown')
    ) {
      return extractTextFromFile(file, fileName)
    }
  }

  // Default to text extraction
  return extractTextFromFile(file, fileName)
}
