/**
 * PDF file processor
 */

export interface PDFExtractionResult {
  text: string
  metadata: {
    sourceFileName: string
    fileType: 'pdf'
    pageCount: number
    characterCount: number
  }
}

export async function extractTextFromPDF(
  file: File | Buffer,
  fileName: string
): Promise<PDFExtractionResult> {
  // Dynamic import to avoid loading pdf-parse in environments where it's not needed
  const pdfParse = await import('pdf-parse')

  let buffer: Buffer

  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer()
    buffer = Buffer.from(arrayBuffer)
  } else {
    buffer = file
  }

  const pdfData = await pdfParse.default(buffer)

  return {
    text: pdfData.text.trim(),
    metadata: {
      sourceFileName: fileName,
      fileType: 'pdf',
      pageCount: pdfData.numpages,
      characterCount: pdfData.text.length,
    },
  }
}
