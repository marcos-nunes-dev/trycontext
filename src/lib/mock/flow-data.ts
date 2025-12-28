import { createEpicNode, createStoryNode, createTaskNode } from '@/lib/flow/node-types'
import { getLayoutedElements } from '@/lib/flow/layout'
import type { FlowNode, FlowEdge } from '@/types/flow'

export function generateMockFlowData(): { nodes: FlowNode[]; edges: FlowEdge[] } {
  // Create Epic nodes (positions will be calculated by layout engine)
  const epic1 = createEpicNode(
    'epic-1',
    'User Authentication System',
    'Implement comprehensive user authentication with OAuth, email/password, and session management',
    { x: 0, y: 0 },
    ['content-1', 'content-2']
  )

  const epic2 = createEpicNode(
    'epic-2',
    'Content Management',
    'Build content ingestion pipeline with support for PDF, images, and transcriptions',
    { x: 0, y: 0 },
    ['content-3']
  )

  const epic3 = createEpicNode(
    'epic-3',
    'AI Analysis & Processing',
    'Integrate LangChain AI to analyze content and generate product plans',
    { x: 0, y: 0 },
    ['content-4', 'content-5']
  )

  // Create Story nodes for Epic 1
  const story1 = createStoryNode(
    'story-1',
    'OAuth Integration',
    'Integrate Google and GitHub OAuth providers',
    'epic-1',
    { x: 0, y: 0 },
    ['content-6']
  )

  const story2 = createStoryNode(
    'story-2',
    'Email/Password Auth',
    'Implement email and password authentication flow',
    'epic-1',
    { x: 0, y: 0 },
    []
  )

  const story3 = createStoryNode(
    'story-3',
    'Session Management',
    'Create secure session handling with JWT tokens',
    'epic-1',
    { x: 0, y: 0 },
    []
  )

  // Create Story nodes for Epic 2
  const story4 = createStoryNode(
    'story-4',
    'File Upload System',
    'Build drag-and-drop file upload interface',
    'epic-2',
    { x: 0, y: 0 },
    []
  )

  const story5 = createStoryNode(
    'story-5',
    'Content Storage',
    'Set up Supabase Storage for file management',
    'epic-2',
    { x: 0, y: 0 },
    []
  )

  const story6 = createStoryNode(
    'story-6',
    'Content Processing Queue',
    'Implement background job queue for content processing',
    'epic-2',
    { x: 0, y: 0 },
    []
  )

  // Create Story nodes for Epic 3
  const story7 = createStoryNode(
    'story-7',
    'LangChain Integration',
    'Set up LangChain with OpenAI for content analysis',
    'epic-3',
    { x: 0, y: 0 },
    []
  )

  const story8 = createStoryNode(
    'story-8',
    'RAG Implementation',
    'Build RAG system for contextual content retrieval',
    'epic-3',
    { x: 0, y: 0 },
    []
  )

  // Create Task nodes for Story 1
  const task1 = createTaskNode(
    'task-1',
    'Set up Google OAuth',
    'Configure Google OAuth credentials and callback URLs for authentication integration',
    'story-1',
    { x: 0, y: 0 },
    'high'
  )

  const task2 = createTaskNode(
    'task-2',
    'Set up GitHub OAuth',
    'Configure GitHub OAuth app and integration settings for user authentication',
    'story-1',
    { x: 0, y: 0 },
    'high'
  )

  // Create Task nodes for Story 2
  const task3 = createTaskNode(
    'task-3',
    'Create signup form',
    'Build email/password registration UI with validation and error handling',
    'story-2',
    { x: 0, y: 0 },
    'medium'
  )

  const task4 = createTaskNode(
    'task-4',
    'Create login form',
    'Build email/password login UI with password reset functionality',
    'story-2',
    { x: 0, y: 0 },
    'medium'
  )

  // Create Task nodes for Story 4
  const task5 = createTaskNode(
    'task-5',
    'Build drag-drop zone',
    'Create UI component for file drag and drop with visual feedback and progress indicators',
    'story-4',
    { x: 0, y: 0 },
    'medium'
  )

  const task6 = createTaskNode(
    'task-6',
    'File validation',
    'Implement file type and size validation with user-friendly error messages',
    'story-4',
    { x: 0, y: 0 },
    'medium'
  )

  // Create Task nodes for Story 7
  const task7 = createTaskNode(
    'task-7',
    'Install LangChain',
    'Set up LangChain dependencies and configure initial connection settings',
    'story-7',
    { x: 0, y: 0 },
    'low'
  )

  const task8 = createTaskNode(
    'task-8',
    'Create AI prompt templates',
    'Design and implement prompt templates for content analysis with context awareness',
    'story-7',
    { x: 0, y: 0 },
    'high'
  )

  const nodes: FlowNode[] = [
    epic1,
    epic2,
    epic3,
    story1,
    story2,
    story3,
    story4,
    story5,
    story6,
    story7,
    story8,
    task1,
    task2,
    task3,
    task4,
    task5,
    task6,
    task7,
    task8,
  ]

  // Create edges connecting epics to stories, and stories to tasks
  const edges: FlowEdge[] = [
    // Epic 1 to Stories
    { id: 'e1-s1', source: 'epic-1', target: 'story-1', type: 'smoothstep' },
    { id: 'e1-s2', source: 'epic-1', target: 'story-2', type: 'smoothstep' },
    { id: 'e1-s3', source: 'epic-1', target: 'story-3', type: 'smoothstep' },
    
    // Epic 2 to Stories
    { id: 'e2-s4', source: 'epic-2', target: 'story-4', type: 'smoothstep' },
    { id: 'e2-s5', source: 'epic-2', target: 'story-5', type: 'smoothstep' },
    { id: 'e2-s6', source: 'epic-2', target: 'story-6', type: 'smoothstep' },
    
    // Epic 3 to Stories
    { id: 'e3-s7', source: 'epic-3', target: 'story-7', type: 'smoothstep' },
    { id: 'e3-s8', source: 'epic-3', target: 'story-8', type: 'smoothstep' },
    
    // Story 1 to Tasks
    { id: 's1-t1', source: 'story-1', target: 'task-1', type: 'smoothstep' },
    { id: 's1-t2', source: 'story-1', target: 'task-2', type: 'smoothstep' },
    
    // Story 2 to Tasks
    { id: 's2-t3', source: 'story-2', target: 'task-3', type: 'smoothstep' },
    { id: 's2-t4', source: 'story-2', target: 'task-4', type: 'smoothstep' },
    
    // Story 4 to Tasks
    { id: 's4-t5', source: 'story-4', target: 'task-5', type: 'smoothstep' },
    { id: 's4-t6', source: 'story-4', target: 'task-6', type: 'smoothstep' },
    
    // Story 7 to Tasks
    { id: 's7-t7', source: 'story-7', target: 'task-7', type: 'smoothstep' },
    { id: 's7-t8', source: 'story-7', target: 'task-8', type: 'smoothstep' },
  ]

  // Apply hierarchical layout using Dagre algorithm
  // This automatically positions nodes in a clean top-to-bottom hierarchy
  const { nodes: layoutedNodes } = getLayoutedElements(nodes, edges, 'TB')

  return { nodes: layoutedNodes, edges }
}
