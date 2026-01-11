# Dialog System Documentation

## Overview

The dialog system provides a consistent, URL-based approach to managing dialogs/modals in the application. All dialogs are accessible via URLs, making them shareable and bookmarkable.

## Architecture

### URL-Based Dialog Pattern

The system uses Next.js App Router's **intercepting routes** with **parallel routes** to create URL-based dialogs that overlay the current page:

```
/app/org/@modal/(.)invite/page.tsx   # Intercepts /org/invite, shows as modal
/app/org/invite/page.tsx              # Fallback page (direct navigation)
```

**Benefits:**
- Clean URLs: `/org/invite`, `/org/members`, `/settings`
- Shareable links
- Modal overlays current page (parallel route)
- Direct navigation falls back to full page
- Browser back button works correctly

### File Structure

```
src/
├── app/
│   ├── @modal/                    # Global modal slot
│   │   ├── (.)create-workspace/
│   │   │   └── page.tsx
│   │   ├── (.)settings/
│   │   │   └── page.tsx
│   │   └── default.tsx
│   ├── org/
│   │   ├── @modal/                # Org modal slot
│   │   │   ├── (.)invite/
│   │   │   │   └── page.tsx
│   │   │   ├── (.)members/
│   │   │   │   └── page.tsx
│   │   │   ├── (.)workspace-management/
│   │   │   │   └── page.tsx
│   │   │   ├── (.)delete-workspace/
│   │   │   │   └── [workspaceId]/
│   │   │   │       └── page.tsx
│   │   │   └── default.tsx
│   │   ├── layout.tsx             # Includes @modal slot
│   │   ├── invite/
│   │   │   └── page.tsx           # Fallback page
│   │   ├── members/
│   │   │   └── page.tsx           # Fallback page
│   │   └── ...
├── components/
│   ├── ui/
│   │   └── dialog/                # Base dialog components
│   │       ├── dialog-container.tsx
│   │       ├── dialog-header.tsx
│   │       ├── dialog-footer.tsx
│   │       ├── dialog-layout.tsx
│   │       └── index.ts
│   └── org/
│       └── dialogs/               # Dialog implementations
│           ├── create-workspace-dialog.tsx
│           ├── invite-user-dialog.tsx
│           ├── workspace-members-dialog.tsx
│           └── ...
└── lib/
    └── dialogs/                   # Dialog utilities
        ├── dialog-router.ts
        ├── dialog-types.ts
        └── dialog-hooks.ts
```

## Base Components

### DialogContainer

Wrapper component that provides consistent dialog styling and size variants.

```tsx
import { DialogContainer } from '@/components/ui/dialog'

<DialogContainer open={open} onOpenChange={handleOpenChange} size="md">
  {/* Dialog content */}
</DialogContainer>
```

**Props:**
- `open: boolean` - Controls dialog visibility
- `onOpenChange: (open: boolean) => void` - Callback when open state changes
- `size?: 'sm' | 'md' | 'lg' | 'xl'` - Dialog size (default: 'md')
- `className?: string` - Additional CSS classes
- `contentProps?: DialogContentProps` - Additional props for DialogContent

### StandardDialogHeader

Standardized header component with title, description, and optional icon.

```tsx
import { StandardDialogHeader } from '@/components/ui/dialog'

<StandardDialogHeader
  title="Dialog Title"
  description="Dialog description"
  icon={SomeIcon}
/>
```

**Props:**
- `title: string` - Dialog title
- `description?: string` - Optional description
- `icon?: LucideIcon` - Optional icon component
- `className?: string` - Additional CSS classes
- `titleClassName?: string` - Title-specific classes
- `descriptionClassName?: string` - Description-specific classes

### StandardDialogFooter

Standardized footer component with action buttons.

```tsx
import { StandardDialogFooter } from '@/components/ui/dialog'

<StandardDialogFooter
  confirmLabel="Confirm"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
  isLoading={isPending}
  confirmVariant="destructive"
  showCancel={true}
/>
```

**Props:**
- `cancelLabel?: string` - Cancel button label (default: 'Cancel')
- `confirmLabel?: React.ReactNode` - Confirm button label (supports JSX)
- `onCancel?: () => void` - Cancel handler
- `onConfirm?: () => void` - Confirm handler
- `isLoading?: boolean` - Loading state
- `confirmVariant?: 'default' | 'destructive'` - Confirm button variant
- `showCancel?: boolean` - Show cancel button (default: true)
- `className?: string` - Additional CSS classes
- `children?: React.ReactNode` - Custom footer content (overrides defaults)

### DialogLayout & DialogSection

Layout components for organizing dialog content.

```tsx
import { DialogLayout, DialogSection } from '@/components/ui/dialog'

<DialogLayout>
  <DialogSection title="Section Title" description="Section description">
    {/* Section content */}
  </DialogSection>
</DialogLayout>
```

## Dialog Router

### useDialogRouter Hook

Hook for navigating to dialogs via URL.

```tsx
import { useDialogRouter } from '@/lib/dialogs/dialog-hooks'

function MyComponent() {
  const { openDialog, closeDialog, isDialogOpen } = useDialogRouter()

  const handleOpenInvite = () => {
    openDialog('/org/invite', { email: 'user@example.com' })
  }

  const handleClose = () => {
    closeDialog() // Uses browser back navigation
  }

  const isOpen = isDialogOpen('/org/invite')
}
```

**Methods:**
- `openDialog(path: DialogRoute, params?: DialogParams[T])` - Navigate to dialog URL
- `closeDialog()` - Close dialog (browser back navigation)
- `isDialogOpen(path: string)` - Check if dialog is open

### useDialogParams Hook

Hook for reading URL parameters in dialog components.

```tsx
import { useDialogParams } from '@/lib/dialogs/dialog-hooks'

function InviteUserDialog() {
  const params = useDialogParams('/org/invite')
  // params.email, params.workspaceId, etc.
}
```

## Creating a New Dialog

### Step 1: Create Dialog Component

Create the dialog component in `src/components/org/dialogs/`:

```tsx
'use client'

import { DialogContainer, StandardDialogHeader, StandardDialogFooter } from '@/components/ui/dialog'
import { useDialogRouter } from '@/lib/dialogs/dialog-hooks'
import { useAction } from '@/hooks/use-action'

interface MyDialogProps {
  open: boolean
  // Other props
}

export function MyDialog({ open }: MyDialogProps) {
  const { closeDialog } = useDialogRouter()
  const { execute, isPending } = useAction(myServerAction, {
    onSuccess: () => {
      closeDialog()
      router.refresh()
    },
  })

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      closeDialog()
    }
  }

  return (
    <DialogContainer open={open} onOpenChange={handleOpenChange} size="md">
      <StandardDialogHeader
        title="My Dialog"
        description="Dialog description"
      />
      {/* Dialog content */}
      <StandardDialogFooter
        confirmLabel="Save"
        onConfirm={handleSubmit}
        onCancel={() => handleOpenChange(false)}
        isLoading={isPending}
        showCancel={true}
      />
    </DialogContainer>
  )
}
```

### Step 2: Create Intercepting Route

Create the intercepting route in `src/app/org/@modal/(.)my-dialog/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server'
import { MyDialog } from '@/components/org/dialogs/my-dialog'
// Import data fetching functions

export default async function MyDialogModalPage() {
  const user = await getServerUser()
  
  if (!user) {
    redirect('/signin')
  }

  // Fetch required data
  const data = await fetchData()

  return <MyDialog open={true} {...data} />
}
```

### Step 3: Create Fallback Page

Create the fallback page in `src/app/org/my-dialog/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server'
import { MyDialog } from '@/components/org/dialogs/my-dialog'

export default async function MyDialogPage() {
  const user = await getServerUser()
  
  if (!user) {
    redirect('/signin')
  }

  const data = await fetchData()

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <MyDialog open={true} {...data} />
      </div>
    </div>
  )
}
```

### Step 4: Update Dialog Types (Optional)

If your dialog uses URL parameters, update `src/lib/dialogs/dialog-types.ts`:

```tsx
export type DialogRoute =
  | '/my-dialog'
  // ... other routes

export interface DialogParams {
  '/my-dialog': {
    param1?: string
    param2?: number
  }
  // ... other params
}
```

### Step 5: Use Dialog

Open the dialog from anywhere in your app:

```tsx
import { useDialogRouter } from '@/lib/dialogs/dialog-hooks'

function MyComponent() {
  const { openDialog } = useDialogRouter()

  return (
    <Button onClick={() => openDialog('/org/my-dialog', { param1: 'value' })}>
      Open Dialog
    </Button>
  )
}
```

## Best Practices

### Component Size

- Keep dialog components under 150 lines
- Split complex dialogs into smaller sub-components
- Extract reusable logic into custom hooks

### Server Actions

- Use `useAction` hook for all server action calls
- Wrap multi-parameter actions in a function for `useAction`:

```tsx
const { execute } = useAction(
  async (params: { id: string; value: string }) => {
    return myServerAction(params.id, params.value)
  },
  {
    onSuccess: () => {
      // Handle success
    },
  }
)
```

### Error Handling

- Use `useAction`'s built-in error handling
- Display errors using the `error` state from `useAction`
- Never use `console.error` in production code

### Loading States

- Use `isPending` from `useAction` for loading states
- Show loading indicators in buttons and forms
- Disable inputs during async operations

### URL Parameters

- Use URL parameters for prefilling form data
- Read parameters with `useDialogParams` hook
- Validate parameters in server components

### Navigation

- Always use `closeDialog()` instead of direct `router.back()`
- Close dialog on successful operations
- Refresh data with `router.refresh()` after mutations

## Dialog Routes

### Global Dialogs

- `/create-workspace` - Create new workspace
- `/settings` - User settings

### Org-Scoped Dialogs

- `/org/invite` - Invite user to workspace
- `/org/members` - Manage workspace members
- `/org/workspace-management` - Manage workspaces
- `/org/delete-workspace/[workspaceId]` - Delete workspace

## Examples

### Simple Confirmation Dialog

```tsx
export function ConfirmDialog({ open, onConfirm }: ConfirmDialogProps) {
  const { closeDialog } = useDialogRouter()

  const handleConfirm = () => {
    onConfirm()
    closeDialog()
  }

  return (
    <DialogContainer open={open} onOpenChange={closeDialog} size="sm">
      <StandardDialogHeader
        title="Confirm Action"
        description="Are you sure you want to proceed?"
      />
      <StandardDialogFooter
        confirmLabel="Confirm"
        onConfirm={handleConfirm}
        onCancel={closeDialog}
        confirmVariant="destructive"
      />
    </DialogContainer>
  )
}
```

### Form Dialog with Validation

```tsx
export function FormDialog({ open }: FormDialogProps) {
  const { closeDialog } = useDialogRouter()
  const [formData, setFormData] = useState({ name: '', email: '' })
  const { execute, isPending, error } = useAction(submitAction, {
    onSuccess: () => {
      closeDialog()
      router.refresh()
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await execute(formData)
  }

  return (
    <DialogContainer open={open} onOpenChange={closeDialog} size="md">
      <StandardDialogHeader title="Edit Profile" />
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 py-4">
          {/* Form fields */}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <StandardDialogFooter
          confirmLabel="Save"
          onConfirm={handleSubmit}
          onCancel={closeDialog}
          isLoading={isPending}
        />
      </form>
    </DialogContainer>
  )
}
```

### Dialog with Sub-Dialogs

```tsx
export function ParentDialog({ open }: ParentDialogProps) {
  const { closeDialog, openDialog } = useDialogRouter()
  const [isSubDialogOpen, setIsSubDialogOpen] = useState(false)

  return (
    <>
      <DialogContainer open={open} onOpenChange={closeDialog}>
        {/* Parent dialog content */}
        <Button onClick={() => openDialog('/org/sub-dialog')}>
          Open Sub-Dialog
        </Button>
      </DialogContainer>
      {/* Sub-dialogs are handled via URL routing */}
    </>
  )
}
```

## Migration from Old System

### Before (Prop-Based)

```tsx
const [isDialogOpen, setIsDialogOpen] = useState(false)

<MyDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
```

### After (URL-Based)

```tsx
const { openDialog, closeDialog } = useDialogRouter()

// Open dialog
openDialog('/org/my-dialog')

// Close dialog
closeDialog()
```

## Troubleshooting

### Dialog Not Opening

- Check that intercepting route exists: `@modal/(.)route/page.tsx`
- Verify parallel route slot is included in layout: `{modal}` in `layout.tsx`
- Ensure `default.tsx` exists for the modal slot

### URL Parameters Not Working

- Check dialog types in `dialog-types.ts`
- Verify `useDialogParams` hook is called with correct route
- Ensure parameters are passed in `openDialog()` call

### Dialog Not Closing

- Use `closeDialog()` from `useDialogRouter` hook
- Check that `onOpenChange` calls `closeDialog()`
- Verify browser back button is enabled

## Additional Resources

- [Next.js Intercepting Routes](https://nextjs.org/docs/app/building-your-application/routing/intercepting-routes)
- [Next.js Parallel Routes](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes)
- [ARCHITECTURE.md](./ARCHITECTURE.md) - General architecture guidelines
