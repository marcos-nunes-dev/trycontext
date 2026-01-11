import type { FlowNode } from '@/types/flow'
import { getNodeDimensions } from './layout'
import {
  getNodeBoundingBox,
  boxesOverlap,
  getSeparationVector,
  getOverlapArea,
  type BoundingBox,
} from './collision-helpers'

interface CollisionOptions {
  /** Maximum iterations to resolve collisions */
  maxIterations?: number
  /** Overlap percentage threshold to trigger resolution (0-1) */
  overlapThreshold?: number
  /** Margin between nodes after resolution */
  margin?: number
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

// Re-export helper types and functions for convenience
export { getNodeBoundingBox, getOverlapArea, boxesOverlap, getSeparationVector } from './collision-helpers'
export type { BoundingBox } from './collision-helpers'
