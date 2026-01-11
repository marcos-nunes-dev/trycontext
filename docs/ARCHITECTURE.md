# Architecture Guidelines

**Version:** 1.0  
**Last Updated:** 2025  
**Status:** Active

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Directory Structure](#directory-structure)
3. [Component Guidelines](#component-guidelines)
4. [State Management](#state-management)
5. [Server Actions](#server-actions)
6. [Hooks Library](#hooks-library)
7. [UI Component Library](#ui-component-library)
8. [Anti-Patterns Reference](#anti-patterns-reference)
9. [Code Review Checklist](#code-review-checklist)
10. [Known Technical Debt](#known-technical-debt)
11. [Future Analysis Triggers](#future-analysis-triggers)

---

## Project Overview

### Tech Stack

- **Framework:** Next.js 16+ (App Router)
- **Language:** TypeScript
- **UI Library:** React 19
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL via Supabase
- **Auth:** Supabase Auth
- **UI Components:** Radix UI, Framer Motion, React Flow
- **State Management:** React Context API

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                    │
│  (Server Components + Server Actions + API Routes)      │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
   │  Pages  │      │ Actions │      │   API   │
   │  (SSR)  │      │ (Server)│      │ Routes  │
   └────┬────┘      └─────────┘      └─────────┘
        │
   ┌────▼────────────────────────────────────┐
   │         Client Components               │
   │  (React Context + Hooks + UI Library)  │
   └─────────────────────────────────────────┘
```

---

## Directory Structure

### Overview

```
src/
├── app/                    # Next.js App Router
│   ├── [route]/           # Route segments
│   │   ├── page.tsx       # Server component (data fetching)
│   │   ├── loading.tsx    # Streaming skeleton
│   │   └── error.tsx      # Error boundary
│   ├── actions/           # Server actions
│   └── api/               # API routes (REST endpoints)
│
├── components/            # React components
│   ├── ui/                # Reusable UI primitives
│   ├── [feature]/         # Feature-specific components
│   └── blocks/            # Larger composed sections
│
├── contexts/              # React Context providers
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and business logic
│   ├── [feature]/
│   │   ├── server.ts      # Server-only functions
│   │   └── client.ts      # Client utilities
│   └── utils.ts           # Shared utilities
│
└── types/                 # TypeScript type definitions
```

### Directory Details

#### `src/app/`

Next.js App Router directory. Contains:

- **Route segments:** Each folder represents a route
- **`page.tsx`:** Server component that fetches data and renders
- **`loading.tsx`:** Loading UI shown during data fetching (streaming)
- **`error.tsx`:** Error boundary for the route
- **`layout.tsx`:** Layout wrapper (shared UI across routes)

**Conventions:**
- Use Server Components by default
- Only mark as `'use client'` when needed (interactivity, hooks, browser APIs)
- Fetch data in Server Components, not in `useEffect`

#### `src/app/actions/`

Server Actions directory. Contains mutation operations.

**Conventions:**
- All files must be marked `'use server'`
- Always validate authentication first
- Return `{ success: boolean, error?: string }` pattern
- Use `revalidatePath` after mutations
- Throw errors for failures (don't return error objects)

#### `src/components/ui/`

Reusable UI primitives. Should be:

- Composable and flexible
- Style-agnostic (use className props)
- Built on Radix UI primitives
- Follow accessibility best practices

#### `src/components/[feature]/`

Feature-specific components. Organized by domain:

- `org/` - Organization/workspace components
- `admin/` - Admin portal components
- `blocks/` - Larger composed sections (hero, sections)

**Conventions:**
- Keep components under 150 lines
- Split large components into smaller, focused modules
- Use composition over configuration

#### `src/contexts/`

React Context providers. Used for:

- Cross-component state sharing
- Avoid prop drilling
- App-wide state (auth, theme, dialogs)

**Conventions:**
- One context per domain concern
- Export both Provider and hook (e.g., `AuthProvider`, `useAuth`)
- Include TypeScript types

#### `src/hooks/`

Custom React hooks. Should be:

- Single-responsibility
- Reusable across components
- Well-typed with TypeScript

**Conventions:**
- Prefix custom hooks with `use`
- Export from `hooks/` directory
- Document with JSDoc comments

#### `src/lib/`

Business logic and utilities. Organized by feature:

- `lib/[feature]/server.ts` - Server-only functions
- `lib/[feature]/client.ts` - Client utilities
- `lib/utils.ts` - Shared utilities (cn, formatDate, etc.)

---

## Component Guidelines

### Size Limits

**Rule:** Components should be **~150 lines maximum**.

**Why:**
- Easier to understand and maintain
- Better for code review
- Forces composition over monolithic files

**When to Split:**

1. **Component exceeds 150 lines** → Split into smaller modules
2. **Multiple concerns in one file** → Extract into separate components
3. **Repeated patterns** → Create reusable component

### Composition Patterns

#### Pattern 1: Parent + Children Components

```tsx
// ❌ Bad: Monolithic component (300+ lines)
export function Header(props: HeaderProps) {
  // 300 lines of mixed concerns
}

// ✅ Good: Composed components
export function Header(props: HeaderProps) {
  return (
    <HeaderProvider {...props}>
      <HeaderRoot>
        <HeaderLogo />
        <HeaderWorkspaceSwitcher />
        <HeaderControls />
        <HeaderUserMenu />
      </HeaderRoot>
      <HeaderDialogs />
    </HeaderProvider>
  )
}
```

#### Pattern 2: Extract Business Logic to Hooks

```tsx
// ❌ Bad: Logic mixed with UI
export function MyComponent() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  // 50 lines of logic...
  // 50 lines of UI...
}

// ✅ Good: Logic in hook, UI in component
export function MyComponent() {
  const { data, loading, error, execute } = useMyFeature()
  // Clean UI code
}
```

### Props vs Context Decision Tree

```
Need state across multiple components?
├─ Yes → Is it app-wide state?
│  ├─ Yes → Use Context (AuthProvider, ThemeProvider)
│  └─ No → Can you lift state up?
│     ├─ Yes → Use props
│     └─ No → Use Context (DialogProvider, WorkspaceProvider)
└─ No → Use local state (useState) or props
```

**Guidelines:**

- **Props:** Simple data passing, parent-child communication
- **Context:** Cross-component state, avoid prop drilling (3+ levels)
- **Local State:** Component-specific state (useState)

---

## State Management

### Available Contexts

#### `AuthContext`

**Location:** `src/contexts/auth-context.tsx`

**Purpose:** Authentication state (user, session)

**Usage:**
```tsx
import { useAuth } from '@/hooks/use-auth'

function MyComponent() {
  const { user, session, signOut } = useAuth()
  // ...
}
```

#### `DialogContext` (To be created)

**Location:** `src/contexts/dialog-context.tsx`

**Purpose:** Centralized dialog management (replaces custom DOM events)

**Usage:**
```tsx
import { useDialogs } from '@/contexts/dialog-context'

function MyComponent() {
  const { openDialog, closeDialog, isOpen } = useDialogs()
  
  const handleClick = () => {
    openDialog('my-dialog-name')
  }
}
```

### When to Use Context

✅ **Use Context for:**
- Authentication state
- Theme preferences
- Dialog state (global dialogs)
- Feature-specific state shared across many components (workspace, flow)

❌ **Don't use Context for:**
- Component-specific state (use `useState`)
- Simple parent-child data (use props)
- Server state (use Server Components + props)

### Server State vs Client State

**Server State:**
- Fetched in Server Components
- Passed via props
- Revalidated after mutations (Server Actions)

**Client State:**
- UI state (modals, dropdowns, form inputs)
- Derived state (computed values)
- Optimistic updates

---

## Server Actions

### Pattern

All mutations use Server Actions located in `src/app/actions/`.

**Standard Pattern:**

```tsx
'use server'

import { getServerUser } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { performAction } from '@/lib/[feature]/server'

export async function myAction(input: ActionInput) {
  // 1. Validate authentication
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // 2. Validate input
  if (!input.field) {
    throw new Error('Field is required')
  }

  // 3. Check permissions (if applicable)
  const canPerform = await checkPermission(user.id, input.resourceId)
  if (!canPerform) {
    throw new Error('Permission denied')
  }

  // 4. Perform action
  const result = await performAction(user.id, input)
  
  if (!result.success) {
    throw new Error(result.error || 'Action failed')
  }

  // 5. Revalidate affected paths
  revalidatePath('/affected-route')
  
  // 6. Return success
  return { success: true }
}
```

### Error Handling

**Rules:**
- Throw errors for failures (don't return error objects)
- Use descriptive error messages
- Never swallow errors silently
- Client will catch and display errors

**Example:**
```tsx
// ❌ Bad: Returning error objects
return { success: false, error: 'Failed' }

// ✅ Good: Throwing errors
throw new Error('Failed to create workspace')
```

### Client Usage

Use `useAction` hook (see [Hooks Library](#hooks-library)):

```tsx
'use client'

import { useAction } from '@/hooks/use-action'
import { myAction } from '@/app/actions/my-actions'

export function MyComponent() {
  const { execute, isPending, error } = useAction(myAction)
  
  const handleSubmit = async () => {
    try {
      await execute(input)
      // Success - action handles revalidation
    } catch (err) {
      // Error already caught by useAction
      // Display error message to user
    }
  }
  
  return (
    <Button onClick={handleSubmit} disabled={isPending}>
      {isPending ? 'Loading...' : 'Submit'}
    </Button>
  )
}
```

---

## Hooks Library

### Available Hooks

#### `useAuth`

**Location:** `src/hooks/use-auth.ts`

**Purpose:** Authentication state and actions

**Usage:**
```tsx
import { useAuth } from '@/hooks/use-auth'

const { user, session, signOut } = useAuth()
```

#### `useWorkspace`

**Location:** `src/hooks/use-workspace.ts`

**Purpose:** Workspace management

**Usage:**
```tsx
import { useWorkspace } from '@/hooks/use-workspace'

const { 
  currentWorkspace, 
  workspaces, 
  switchToWorkspace, 
  createWorkspace,
  isSwitching 
} = useWorkspace({ currentWorkspace, workspaces })
```

#### `useAction`

**Location:** `src/hooks/use-action.ts`

**Purpose:** Standardized server action handling with loading/error states

**Usage:**
```tsx
import { useAction } from '@/hooks/use-action'
import { myAction } from '@/app/actions/my-actions'

const { execute, isPending, error } = useAction(myAction)

// execute calls the action and handles loading/error states
await execute(input)
```

#### `useDialogRouter`

**Location:** `src/lib/dialogs/dialog-hooks.ts`

**Purpose:** URL-based dialog management (replaces custom DOM events and local state)

**Usage:**
```tsx
import { useDialogRouter } from '@/lib/dialogs/dialog-hooks'

const { openDialog, closeDialog, isDialogOpen } = useDialogRouter()

// Open a dialog via URL
openDialog('/org/invite', { email: 'user@example.com' })

// Check if dialog is open
const isOpen = isDialogOpen('/org/invite')

// Close dialog
closeDialog()
```

**See [DIALOGS.md](./DIALOGS.md) for complete documentation.**

### When to Create New Hooks

✅ **Create a hook when:**
- Logic is reused across multiple components
- Complex state management needed
- Need to abstract React patterns (effects, state)

❌ **Don't create a hook when:**
- Logic is used in one place (keep in component)
- Simple state (use `useState` directly)
- Server data fetching (use Server Components)

---

## UI Component Library

### Available Primitives

Located in `src/components/ui/`:

- `button.tsx` - Button component with variants
- `dialog.tsx` - Dialog/modal component (Radix UI)
- `input.tsx` - Input field
- `label.tsx` - Form label
- `card.tsx` - Card container
- `badge.tsx` - Badge/tag component
- `avatar.tsx` - Avatar component
- `dropdown-menu.tsx` - Dropdown menu
- `select.tsx` - Select dropdown
- `toast.tsx` - Toast notifications
- And more...

### Styling Conventions

- **Tailwind CSS v4** for styling
- **CSS Variables** for theme values (see `globals.css`)
- **CVA (Class Variance Authority)** for component variants
- **cn() utility** for conditional class names

**Example:**
```tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        outline: 'border border-input bg-background',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
```

### Creating New UI Components

1. **Check existing components** - Don't duplicate functionality
2. **Use Radix UI primitives** - For accessibility
3. **Follow variant pattern** - Use CVA for variants
4. **Export from `ui/` directory** - Keep primitives organized
5. **Document with TypeScript** - Include prop types

---

## Anti-Patterns Reference

### ❌ Custom DOM Events

**Problem:**
```tsx
// ❌ Bad: Using custom DOM events for React communication
document.dispatchEvent(new CustomEvent('open-create-workspace-dialog'))
document.addEventListener('open-create-workspace-dialog', handler)
```

**Why it's bad:**
- Breaks React's data flow
- Hard to debug
- Not type-safe
- Memory leaks if not cleaned up

**Solution:**
```tsx
// ✅ Good: Use URL-based dialog router
import { useDialogRouter } from '@/lib/dialogs/dialog-hooks'

const { openDialog } = useDialogRouter()
openDialog('/org/create-workspace')

// Or pass callback props for simple local state
<ChildComponent onOpenDialog={() => setIsOpen(true)} />
```

### ❌ setTimeout for State Coordination

**Problem:**
```tsx
// ❌ Bad: Using setTimeout for React state
await new Promise(resolve => setTimeout(resolve, 150))
await onWorkspaceSelect(workspace.id)
```

**Why it's bad:**
- Unnecessary delays
- Race conditions
- Not React-idiomatic
- Hard to test

**Solution:**
```tsx
// ✅ Good: Use React transitions or callbacks
import { startTransition } from 'react'

startTransition(() => {
  onWorkspaceSelect(workspace.id)
})

// Or use animation callbacks
<AnimatedComponent
  onAnimationComplete={() => onWorkspaceSelect(workspace.id)}
/>
```

### ❌ Unnecessary useEffect

**Problem:**
```tsx
// ❌ Bad: useEffect for derived state
const [fullName, setFullName] = useState('')

useEffect(() => {
  setFullName(`${firstName} ${lastName}`)
}, [firstName, lastName])
```

**Why it's bad:**
- Extra renders
- Synchronization issues
- Can be derived instead

**Solution:**
```tsx
// ✅ Good: Derive from props/state
const fullName = `${firstName} ${lastName}`

// Or use useMemo for expensive calculations
const fullName = useMemo(
  () => `${firstName} ${lastName}`,
  [firstName, lastName]
)
```

### ❌ Components Over 150 Lines

**Problem:**
```tsx
// ❌ Bad: 300+ line component
export function OrgPortalClient(props) {
  // 300 lines of mixed concerns...
}
```

**Solution:**
```tsx
// ✅ Good: Split into smaller components
export function OrgPortalClient(props) {
  return (
    <WorkspaceProvider>
      <OrgLayout>
        <FlowContainer />
        <ContentPanel />
      </OrgLayout>
    </WorkspaceProvider>
  )
}
```

### ❌ Inline Dialog Definitions

**Problem:**
```tsx
// ❌ Bad: Multiple dialogs defined inline
export function Header() {
  const [dialog1Open, setDialog1Open] = useState(false)
  const [dialog2Open, setDialog2Open] = useState(false)
  const [dialog3Open, setDialog3Open] = useState(false)
  
  return (
    <>
      <Dialog open={dialog1Open} onOpenChange={setDialog1Open}>...</Dialog>
      <Dialog open={dialog2Open} onOpenChange={setDialog2Open}>...</Dialog>
      <Dialog open={dialog3Open} onOpenChange={setDialog3Open}>...</Dialog>
    </>
  )
}
```

**Solution:**
```tsx
// ✅ Good: Use URL-based dialogs with useDialogRouter
import { useDialogRouter } from '@/lib/dialogs/dialog-hooks'

export function Header() {
  const { openDialog } = useDialogRouter()
  
  return (
    <Button onClick={() => openDialog('/org/invite')}>Invite User</Button>
  )
}
```

**See [DIALOGS.md](./DIALOGS.md) for complete dialog system documentation.**

### ❌ console.log in Production

**Problem:**
```tsx
// ❌ Bad: console.log everywhere
console.log('User data:', user)
console.error('Error:', error)
```

**Solution:**
```tsx
// ✅ Good: Use proper logging (or remove in production)
if (process.env.NODE_ENV === 'development') {
  console.log('User data:', user)
}

// Or use a logging service
logger.info('User data', { user })
```

### ❌ TypeScript `any` Type

**Problem:**
```tsx
// ❌ Bad: Using `any`
function processData(data: any) {
  return data.value
}
```

**Solution:**
```tsx
// ✅ Good: Use proper types
interface Data {
  value: string
}

function processData(data: Data) {
  return data.value
}

// Or use `unknown` for truly unknown types
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value
  }
  throw new Error('Invalid data')
}
```

---

## Code Review Checklist

### Pre-Commit Checklist

Before committing code, verify:

- [ ] No components exceed 150 lines
- [ ] No custom DOM events used (`document.dispatchEvent`, `addEventListener` for component communication)
- [ ] No unnecessary `useEffect` (can logic be derived instead?)
- [ ] No `setTimeout` for state coordination
- [ ] Loading states implemented where needed
- [ ] Error handling in place (try/catch, error.tsx files)
- [ ] TypeScript strict (no `any` types)
- [ ] Server actions return `{ success: boolean, error?: string }` pattern
- [ ] `revalidatePath` called after mutations
- [ ] Checked existing hooks/components before creating new ones
- [ ] Dialogs use URL-based system (`useDialogRouter` hook)
- [ ] Dialogs use base components (`DialogContainer`, `StandardDialogHeader`, `StandardDialogFooter`)
- [ ] Dialogs use `useAction` hook for server calls
- [ ] Added `loading.tsx` for new routes
- [ ] Added `error.tsx` for new routes

### PR Review Checklist

When reviewing pull requests, check:

**Architecture:**
- [ ] Follows directory structure conventions
- [ ] Uses Server Components appropriately
- [ ] Server actions follow standard pattern
- [ ] Context used appropriately (not overused)

**Components:**
- [ ] Components are appropriately sized (<150 lines)
- [ ] Proper composition patterns used
- [ ] UI components from `src/components/ui/` used when possible
- [ ] No inline dialog definitions

**Code Quality:**
- [ ] TypeScript types are correct (no `any`)
- [ ] Error handling is present
- [ ] Loading states implemented
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] Code is readable and maintainable

**Testing:**
- [ ] Manual testing performed
- [ ] Edge cases considered
- [ ] Error scenarios handled

### Architecture Compliance Checklist

For major features or refactors:

- [ ] Follows `.cursorrules` guidelines
- [ ] Follows patterns in `docs/ARCHITECTURE.md`
- [ ] No anti-patterns introduced
- [ ] Documented any deviations from standard patterns
- [ ] Updated documentation if patterns change

---

## Known Technical Debt

See [`TECHNICAL_DEBT.md`](./TECHNICAL_DEBT.md) for detailed list of known issues.

**High Priority:**
- Email service integration (production requirement)
- DialogProvider implementation (architecture improvement)
- Component refactoring (org-portal-client, header)

**Medium Priority:**
- Content upload functionality
- Settings functionality
- Error handling improvements
- Rate limiting

**Low Priority:**
- Export functionality
- Help functionality
- User profiles table optimization

---

## Future Analysis Triggers

### When to Run Architecture Analysis

Run a codebase analysis when:

1. **Adding major features** - Ensure new code follows patterns
2. **After multiple PRs merged** - Check for drift from guidelines
3. **Before refactoring** - Identify current issues
4. **When performance degrades** - May indicate architectural issues
5. **When onboarding new developers** - Review and update guidelines

### Commands for Analysis

**Component Size Analysis:**
```bash
# Find components over 150 lines (example)
find src/components -name "*.tsx" -exec wc -l {} + | sort -rn | head -20
```

**Find Custom DOM Events:**
```bash
grep -r "document.dispatchEvent\|addEventListener" src/
```

**Find setTimeout Usage:**
```bash
grep -r "setTimeout" src/
```

**Find TypeScript `any` Types:**
```bash
grep -r ": any" src/ --include="*.ts" --include="*.tsx"
```

**Find console.log Statements:**
```bash
grep -r "console\\.log\\|console\\.error" src/
```

### Questions to Ask During Analysis

1. Are all components under 150 lines?
2. Are custom DOM events still being used?
3. Are there unnecessary `useEffect` hooks?
4. Are `setTimeout` calls used for state coordination?
5. Do all routes have `loading.tsx` and `error.tsx`?
6. Are server actions following the standard pattern?
7. Is TypeScript strict (no `any` types)?
8. Are loading states implemented everywhere needed?
9. Is error handling comprehensive?

---

## Appendix

### Quick Reference

**File Size Limits:**
- Components: ~150 lines max
- Split when: >150 lines or multiple concerns

**State Management:**
- Local state: `useState`
- Props: Parent-child communication
- Context: Cross-component state (3+ levels)

**Server Actions:**
- Location: `src/app/actions/`
- Pattern: Validate → Check permissions → Execute → Revalidate
- Return: `{ success: boolean }` or throw error

**Components:**
- Server Components by default
- Mark `'use client'` only when needed
- Use composition over configuration

**Anti-Patterns to Avoid:**
- Custom DOM events
- `setTimeout` for state
- Unnecessary `useEffect`
- Components >150 lines
- Inline dialogs
- `console.log` in production
- TypeScript `any`

---

**Last Updated:** 2025  
**Maintained By:** Development Team  
**Review Frequency:** Quarterly or after major refactors
