/**
 * Transcript file processor (SRT, VTT)
 */

export interface TranscriptExtractionResult {
  text: string
  metadata: {
    sourceFileName: string
    fileType: 'srt' | 'vtt'
    segmentCount: number
  }
}

export async function extractTextFromTranscript(
  file: File | Buffer,
  fileName: string
): Promise<TranscriptExtractionResult> {
  let rawText: string

  if (file instanceof File) {
    rawText = await file.text()
  } else {
    rawText = file.toString('utf-8')
  }

  const isVTT = fileName.toLowerCase().endsWith('.vtt')
  const fileType = isVTT ? 'vtt' : 'srt'

  // Clean up transcript format - remove timestamps and formatting
  // SRT format: sequence number, timestamp, text, blank line
  // VTT format: timestamp, text, blank line
  let cleanedText = rawText
    // Remove sequence numbers (SRT)
    .replace(/^\d+\s*$/gm, '')
    // Remove timestamps (both SRT and VTT)
    .replace(/\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}/gm, '')
    // Remove VTT cues
    .replace(/^NOTE\s.*$/gm, '')
    .replace(/^WEBVTT.*$/gm, '')
    // Remove HTML tags if present
    .replace(/<[^>]+>/g, '')
    // Remove multiple blank lines
    .replace(/\n{3,}/g, '\n\n')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .trim()

  // Count segments (rough estimate - lines that look like dialogue)
  const segmentCount = cleanedText.split('\n').filter(line => line.length > 10).length

  return {
    text: cleanedText,
    metadata: {
      sourceFileName: fileName,
      fileType,
      segmentCount,
    },
  }
}
