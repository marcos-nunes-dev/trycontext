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
 * 
 * @param text - Text to chunk
 * @param metadata - Metadata to attach to each chunk
 * @param chunkSize - Maximum size of each chunk (default: 1000)
 * @param chunkOverlap - Number of characters to overlap between chunks (default: 150)
 * @returns Array of chunks with text, index, and metadata
 * @throws Error if chunkSize or chunkOverlap are invalid
 */
export async function chunkText(
  text: string,
  metadata: Record<string, unknown>,
  chunkSize = 1000,
  chunkOverlap = 150
): Promise<Chunk[]> {
  // Input validation
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Text is required and must be a non-empty string')
  }
  if (chunkSize <= 0 || !Number.isInteger(chunkSize)) {
    throw new Error('chunkSize must be a positive integer')
  }
  if (chunkOverlap < 0 || !Number.isInteger(chunkOverlap)) {
    throw new Error('chunkOverlap must be a non-negative integer')
  }
  if (chunkOverlap >= chunkSize) {
    throw new Error('chunkOverlap must be less than chunkSize')
  }
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
 * 
 * @param chunks - Array of chunks to create embeddings for
 * @param model - OpenAI embedding model to use (default: 'text-embedding-3-small')
 * @returns Array of chunks with embeddings attached
 * @throws Error if OpenAI API key is not set, chunks array is empty, or embedding creation fails
 */
export async function createEmbeddings(
  chunks: Chunk[],
  model = 'text-embedding-3-small'
): Promise<EmbeddedChunk[]> {
  // Input validation
  if (!chunks || chunks.length === 0) {
    throw new Error('Chunks array is required and must not be empty')
  }
  if (!model || typeof model !== 'string') {
    throw new Error('Model must be a non-empty string')
  }
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
 * 
 * @param extractionResult - Result from text extraction with text and metadata
 * @param chunkSize - Maximum size of each chunk (default: 1000)
 * @param chunkOverlap - Number of characters to overlap between chunks (default: 150)
 * @returns Array of embedded chunks ready for storage
 * @throws Error if extraction result is invalid, chunking fails, or embedding creation fails
 */
export async function processContent(
  extractionResult: ExtractionResult,
  chunkSize = 1000,
  chunkOverlap = 150
): Promise<EmbeddedChunk[]> {
  // Input validation
  if (!extractionResult || !extractionResult.text) {
    throw new Error('Extraction result is required and must contain text')
  }
  
  // Chunk the text (now async)
  const chunks = await chunkText(extractionResult.text, extractionResult.metadata, chunkSize, chunkOverlap)

  // Create embeddings
  const embeddedChunks = await createEmbeddings(chunks)

  return embeddedChunks
}
