export type DialogRoute =
  | '/org/create-workspace'
  | '/org/settings'
  | '/org/invite'
  | '/org/members'
  | '/org/workspace-management'
  | `/org/delete-workspace/${string}`

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
}

export function isDialogRoute(path: string): path is DialogRoute {
  return [
    '/org/create-workspace',
    '/org/settings',
    '/org/invite',
    '/org/members',
    '/org/workspace-management',
  ].some(route => path.startsWith(route)) || path.startsWith('/org/delete-workspace/')
}
