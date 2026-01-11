/**
 * Content ingestion orchestration
 * Handles chunking, embedding, and persistence
 */

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OpenAIEmbeddings } from '@langchain/openai'
import type { ExtractionResult } from './processors'

export interface Chunk {
  text: string
  index: number
  metadata: Record<string, unknown>
}

export interface EmbeddedChunk extends Chunk {
  embedding: number[]
  embeddingModel: string
}

/**
 * Chunk text using LangChain's RecursiveCharacterTextSplitter
 */
export async function chunkText(
  text: string,
  metadata: Record<string, unknown>,
  chunkSize = 1000,
  chunkOverlap = 150
): Promise<Chunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: ['\n\n', '\n', '. ', ' ', ''],
  })

  // splitText might be async in newer versions, handle both cases
  let chunks: string[]
  const result = splitter.splitText(text)
  
  if (result instanceof Promise) {
    chunks = await result
  } else if (Array.isArray(result)) {
    chunks = result
  } else {
    // Fallback: if it's not an array, try to convert or use simple splitting
    chunks = typeof result === 'string' ? [result] : []
  }

  // Ensure we have an array
  if (!Array.isArray(chunks)) {
    // Fallback: simple character-based chunking
    chunks = []
    for (let i = 0; i < text.length; i += chunkSize - chunkOverlap) {
      chunks.push(text.slice(i, i + chunkSize))
    }
  }

  return chunks.map((chunkText, index) => ({
    text: chunkText,
    index,
    metadata: {
      ...metadata,
      chunkIndex: index,
    },
  }))
}

/**
 * Create embeddings for chunks using OpenAI
 */
export async function createEmbeddings(
  chunks: Chunk[],
  model = 'text-embedding-3-small'
): Promise<EmbeddedChunk[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  const embeddings = new OpenAIEmbeddings({
    modelName: model,
    openAIApiKey: process.env.OPENAI_API_KEY,
  })

  const texts = chunks.map(chunk => chunk.text)
  const embeddingVectors = await embeddings.embedDocuments(texts)

  return chunks.map((chunk, index) => ({
    ...chunk,
    embedding: embeddingVectors[index],
    embeddingModel: model,
  }))
}

/**
 * Process extracted text: chunk and embed
 */
export async function processContent(
  extractionResult: ExtractionResult,
  chunkSize = 1000,
  chunkOverlap = 150
): Promise<EmbeddedChunk[]> {
  // Chunk the text (now async)
  const chunks = await chunkText(extractionResult.text, extractionResult.metadata, chunkSize, chunkOverlap)

  // Create embeddings
  const embeddedChunks = await createEmbeddings(chunks)

  return embeddedChunks
}
