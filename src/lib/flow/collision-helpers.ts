import { getNodeDimensions } from './layout'
import type { FlowNode } from '@/types/flow'

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Get the bounding box of a node
 */
export function getNodeBoundingBox(node: FlowNode): BoundingBox {
  const { width, height } = getNodeDimensions(node.type || 'task')
  return {
    x: node.position.x,
    y: node.position.y,
    width,
    height,
  }
}

/**
 * Calculate the overlap area between two bounding boxes
 */
export function getOverlapArea(box1: BoundingBox, box2: BoundingBox): number {
  const xOverlap = Math.max(
    0,
    Math.min(box1.x + box1.width, box2.x + box2.width) - Math.max(box1.x, box2.x)
  )
  const yOverlap = Math.max(
    0,
    Math.min(box1.y + box1.height, box2.y + box2.height) - Math.max(box1.y, box2.y)
  )
  return xOverlap * yOverlap
}

/**
 * Check if two boxes overlap beyond the threshold
 */
export function boxesOverlap(box1: BoundingBox, box2: BoundingBox, threshold: number): boolean {
  const overlapArea = getOverlapArea(box1, box2)
  const minArea = Math.min(box1.width * box1.height, box2.width * box2.height)
  return overlapArea / minArea > threshold
}

/**
 * Calculate the separation vector needed to resolve overlap
 */
export function getSeparationVector(
  box1: BoundingBox,
  box2: BoundingBox,
  margin: number
): { dx: number; dy: number } {
  const center1 = { x: box1.x + box1.width / 2, y: box1.y + box1.height / 2 }
  const center2 = { x: box2.x + box2.width / 2, y: box2.y + box2.height / 2 }

  const dx = center1.x - center2.x
  const dy = center1.y - center2.y

  // Calculate minimum separation distance
  const minSepX = (box1.width + box2.width) / 2 + margin
  const minSepY = (box1.height + box2.height) / 2 + margin

  // Determine which direction to push
  const overlapX = minSepX - Math.abs(dx)
  const overlapY = minSepY - Math.abs(dy)

  // Push in the direction of least overlap
  if (overlapX > 0 && overlapY > 0) {
    if (overlapX < overlapY) {
      // Push horizontally
      return { dx: (dx >= 0 ? overlapX : -overlapX) / 2, dy: 0 }
    } else {
      // Push vertically
      return { dx: 0, dy: (dy >= 0 ? overlapY : -overlapY) / 2 }
    }
  }

  return { dx: 0, dy: 0 }
}
