export type DialogRoute =
  | '/org/create-workspace'
  | '/org/settings'
  | '/org/invite'
  | '/org/members'
  | '/org/workspace-management'
  | `/org/delete-workspace/${string}`
  | '/org/upload-context'
  | '/org/attach-context'
  | '/org/detach-context'
  | '/org/ai-suggestions'

export interface DialogParams {
  '/org/invite': {
    email?: string
    workspaceId?: string
  }
  '/org/members': {
    workspaceId?: string
  }
  '/org/delete-workspace/[workspaceId]': {
    workspaceId: string
  }
  '/org/create-workspace': Record<string, never>
  '/org/settings': Record<string, never>
  '/org/workspace-management': Record<string, never>
  '/org/upload-context': {
    workspaceId: string
    scopeType: 'workspace' | 'epic' | 'story' | 'task'
    scopeId?: string
  }
  '/org/attach-context': {
    workspaceId: string
    scopeType: 'workspace' | 'epic' | 'story' | 'task'
    scopeId?: string
  }
  '/org/detach-context': {
    workspaceId: string
    contentId: string
    fileName?: string
  }
  '/org/ai-suggestions': {
    workspaceId: string
  }
}

export function isDialogRoute(path: string): path is DialogRoute {
  return [
    '/org/create-workspace',
    '/org/settings',
    '/org/invite',
    '/org/members',
    '/org/workspace-management',
    '/org/upload-context',
    '/org/attach-context',
    '/org/detach-context',
    '/org/ai-suggestions',
  ].some(route => path.startsWith(route)) || path.startsWith('/org/delete-workspace/')
}
