import type { FlowNode } from '@/types/flow'
import { getNodeDimensions } from './layout'

interface CollisionOptions {
  /** Maximum iterations to resolve collisions */
  maxIterations?: number
  /** Overlap percentage threshold to trigger resolution (0-1) */
  overlapThreshold?: number
  /** Margin between nodes after resolution */
  margin?: number
}

interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Get the bounding box of a node
 */
function getNodeBoundingBox(node: FlowNode): BoundingBox {
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
function getOverlapArea(box1: BoundingBox, box2: BoundingBox): number {
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
function boxesOverlap(box1: BoundingBox, box2: BoundingBox, threshold: number): boolean {
  const overlapArea = getOverlapArea(box1, box2)
  const minArea = Math.min(box1.width * box1.height, box2.width * box2.height)
  return overlapArea / minArea > threshold
}

/**
 * Calculate the separation vector needed to resolve overlap
 */
function getSeparationVector(
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

/**
 * Resolve collisions between nodes by pushing overlapping nodes apart
 * Uses an iterative approach similar to physics-based collision resolution
 */
export function resolveCollisions(
  nodes: FlowNode[],
  options: CollisionOptions = {}
): FlowNode[] {
  const {
    maxIterations = 50,
    overlapThreshold = 0.01, // Any overlap triggers resolution
    margin = 15,
  } = options

  if (nodes.length < 2) {
    return nodes
  }

  // Create mutable positions
  const positions = nodes.map((node) => ({
    id: node.id,
    x: node.position.x,
    y: node.position.y,
    type: node.type,
  }))

  let hasCollision = true
  let iteration = 0

  while (hasCollision && iteration < maxIterations) {
    hasCollision = false
    iteration++

    // Check each pair of nodes
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const pos1 = positions[i]
        const pos2 = positions[j]

        const box1: BoundingBox = {
          x: pos1.x,
          y: pos1.y,
          ...getNodeDimensions(pos1.type || 'task'),
        }
        const box2: BoundingBox = {
          x: pos2.x,
          y: pos2.y,
          ...getNodeDimensions(pos2.type || 'task'),
        }

        if (boxesOverlap(box1, box2, overlapThreshold)) {
          hasCollision = true
          const { dx, dy } = getSeparationVector(box1, box2, margin)

          // Push nodes apart (both nodes move half the distance)
          pos1.x += dx
          pos1.y += dy
          pos2.x -= dx
          pos2.y -= dy
        }
      }
    }
  }

  // Apply new positions to nodes
  return nodes.map((node) => {
    const newPos = positions.find((p) => p.id === node.id)
    if (newPos) {
      return {
        ...node,
        position: {
          x: newPos.x,
          y: newPos.y,
        },
      }
    }
    return node
  })
}

/**
 * Check if any nodes in the array are overlapping
 */
export function hasOverlappingNodes(nodes: FlowNode[], margin: number = 0): boolean {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const box1 = getNodeBoundingBox(nodes[i])
      const box2 = getNodeBoundingBox(nodes[j])

      // Expand boxes by margin
      box1.x -= margin / 2
      box1.y -= margin / 2
      box1.width += margin
      box1.height += margin

      if (getOverlapArea(box1, box2) > 0) {
        return true
      }
    }
  }
  return false
}
