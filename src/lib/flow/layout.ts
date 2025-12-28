import dagre from '@dagrejs/dagre'
import type { FlowNode, FlowEdge } from '@/types/flow'

// Node dimensions by type
const NODE_DIMENSIONS = {
  epic: { width: 300, height: 150 },
  story: { width: 280, height: 120 },
  task: { width: 240, height: 100 },
} as const

// Layout configuration
const LAYOUT_CONFIG = {
  rankdir: 'TB' as const, // Top-to-bottom
  ranksep: 120, // Vertical spacing between hierarchy levels
  nodesep: 60, // Horizontal spacing between sibling nodes
  marginx: 40,
  marginy: 40,
}

/**
 * Get dimensions for a node based on its type
 */
export function getNodeDimensions(type: string): { width: number; height: number } {
  return NODE_DIMENSIONS[type as keyof typeof NODE_DIMENSIONS] || { width: 200, height: 100 }
}

/**
 * Apply hierarchical layout to nodes using Dagre algorithm
 * This creates a clean top-to-bottom flow: Epic → Story → Task
 */
export function getLayoutedElements(
  nodes: FlowNode[],
  edges: FlowEdge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  if (nodes.length === 0) {
    return { nodes, edges }
  }

  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  const isHorizontal = direction === 'LR'

  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: LAYOUT_CONFIG.ranksep,
    nodesep: LAYOUT_CONFIG.nodesep,
    marginx: LAYOUT_CONFIG.marginx,
    marginy: LAYOUT_CONFIG.marginy,
  })

  // Add nodes to the graph with their dimensions
  nodes.forEach((node) => {
    const { width, height } = getNodeDimensions(node.type || 'task')
    dagreGraph.setNode(node.id, { width, height })
  })

  // Add edges to establish hierarchy
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  // Run the layout algorithm
  dagre.layout(dagreGraph)

  // Apply calculated positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    const { width, height } = getNodeDimensions(node.type || 'task')

    // Dagre positions nodes by center, React Flow uses top-left
    // So we need to adjust the position
    const newNode: FlowNode = {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
      // Update handle positions based on layout direction
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
    } as FlowNode

    return newNode
  })

  return { nodes: layoutedNodes, edges }
}

/**
 * Calculate the bounding box of all nodes
 */
export function getNodesBoundingBox(nodes: FlowNode[]): {
  x: number
  y: number
  width: number
  height: number
} {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  nodes.forEach((node) => {
    const { width, height } = getNodeDimensions(node.type || 'task')
    minX = Math.min(minX, node.position.x)
    minY = Math.min(minY, node.position.y)
    maxX = Math.max(maxX, node.position.x + width)
    maxY = Math.max(maxY, node.position.y + height)
  })

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

/**
 * Center all nodes around a point (useful after layout)
 */
export function centerNodes(
  nodes: FlowNode[],
  centerX: number = 0,
  centerY: number = 0
): FlowNode[] {
  const bbox = getNodesBoundingBox(nodes)
  const offsetX = centerX - (bbox.x + bbox.width / 2)
  const offsetY = centerY - (bbox.y + bbox.height / 2)

  return nodes.map((node) => ({
    ...node,
    position: {
      x: node.position.x + offsetX,
      y: node.position.y + offsetY,
    },
  }))
}
