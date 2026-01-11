# Technical Debt & Temporary Implementations

This document tracks all known technical debts, temporary implementations, and areas that need improvement in the codebase.

## Email Service

### Status: Temporary Implementation
**Location:** `src/lib/email/invitations.ts`

**Current State:**
- In development: Logs invitation emails to console
- In production: Returns success without actually sending emails
- Email templates are generated but not sent via any service

**Issues:**
- No actual email delivery in production
- TODO comment indicates need to integrate with Resend, SendGrid, or similar service
- Email sending is mocked with `console.log` statements

**Action Required:**
- [ ] Integrate with email service (Resend, SendGrid, or Supabase email service)
- [ ] Remove console.log statements
- [ ] Add proper error handling for email delivery failures
- [ ] Add email delivery status tracking

**Priority:** High (Required for workspace sharing to work in production)

---

## Content Ingestion (Context Upload)

### Status: Implemented (MVP)
**Location:** `src/app/actions/content.ts`, `src/lib/content/`

**Current State:**
- File upload and ingestion pipeline implemented
- Supports PDF, TXT, MD, SRT, VTT, PNG, JPG
- Synchronous processing (may timeout on large files)
- Vector embeddings stored in pgvector

**Temporary Decisions:**
- **Synchronous ingestion**: May hit serverless timeouts for large PDFs (>50MB or complex documents). Future: Move to async job queue (BullMQ or similar).
- **Fixed embedding dimension**: `vector(1536)` hardcoded for OpenAI `text-embedding-3-small`. Future model changes require migration.
- **Vector insertion**: Currently passing arrays directly to Supabase. If PostgREST doesn't handle vector types, may need database function wrapper.

**Action Required:**
- [ ] Monitor for timeout issues with large files
- [ ] Plan async job queue migration when needed
- [ ] Test vector insertion with actual Supabase instance
- [ ] Add database function for vector insertion if direct insert fails
- [ ] Consider adding progress tracking for long-running ingestions

**Priority:** Medium (works for MVP, but needs monitoring)

---

## Export Functionality

### Status: Not Implemented
**Location:** `src/components/portals/org-portal-client.tsx` (line 226)

**Current State:**
- `handleExport` callback is empty
- TODO comment: "Implement export functionality"

**Action Required:**
- [ ] Implement export options (JSON, CSV, PDF)
- [ ] Add export UI/button
- [ ] Create export data formatting logic
- [ ] Add download functionality

**Priority:** Low

---

## Settings Functionality

### Status: Not Implemented
**Location:** `src/components/portals/org-portal-client.tsx` (line 230)

**Current State:**
- `handleSettings` callback is empty
- TODO comment: "Implement settings functionality"
- Settings button exists in header but does nothing

**Action Required:**
- [ ] Create settings page/dialog
- [ ] Add workspace settings (name, description, etc.)
- [ ] Add user preferences
- [ ] Add notification settings
- [ ] Add theme/appearance settings

**Priority:** Medium

---

## Help Functionality

### Status: Not Implemented
**Location:** `src/components/portals/org-portal-client.tsx` (line 234)

**Current State:**
- `handleHelp` callback is empty
- TODO comment: "Implement help functionality"

**Action Required:**
- [ ] Create help/documentation page
- [ ] Add keyboard shortcuts guide
- [ ] Add feature tutorials
- [ ] Add FAQ section
- [ ] Add contact/support links

**Priority:** Low

---

## Mock Folder Structure

### Status: Temporary Implementation
**Location:** `src/components/portals/org-portal.tsx` (line 39)

**Current State:**
- Hardcoded folder structure with single "General Context" folder
- Comment: "Mock folder structure for now - will be fetched from database later"

**Issues:**
- Not connected to database
- No actual folder/file management
- Content panel shows static data

**Action Required:**
- [ ] Create database schema for folders/files
- [ ] Implement folder CRUD operations
- [ ] Fetch folders from database
- [ ] Add folder/file management UI
- [ ] Connect to content upload functionality

**Priority:** Medium

---

## Error Handling & Logging

### Status: Inconsistent
**Location:** Multiple files

**Current State:**
- Many `console.error()` statements throughout codebase
- No centralized error logging service
- Errors often logged but not shown to users
- No error tracking/monitoring integration

**Files with console.error:**
- `src/lib/workspaces/server.ts` (multiple instances)
- `src/lib/workspaces/invitations.ts`
- `src/lib/flow/server.ts`
- `src/components/portals/org-portal-client.tsx`
- `src/components/org/workspace-members-dialog.tsx`

**Action Required:**
- [ ] Implement centralized error logging service
- [ ] Replace console.error with proper logging
- [ ] Add user-friendly error messages
- [ ] Integrate error tracking (Sentry, LogRocket, etc.)
- [ ] Add error boundaries for better UX
- [ ] Create error notification system

**Priority:** Medium

---

## User Details Fetching

### Status: Partially Implemented
**Location:** `src/lib/workspaces/server.ts` (getWorkspaceMembers)

**Current State:**
- Uses service role client to fetch user details from auth.users
- Error handling exists but could be improved
- Comment mentions "we'll fetch user details separately" in dialog component

**Issues:**
- Service role client usage may have performance implications
- No caching of user details
- Could be optimized with a user profiles table

**Action Required:**
- [ ] Consider creating `public.user_profiles` table for better performance
- [ ] Add caching layer for user details
- [ ] Optimize user lookup queries
- [ ] Add user avatar/image support

**Priority:** Low

---

## Invitation Management Features

### Status: Missing Features
**Location:** `src/lib/workspaces/invitations.ts`

**Current State:**
- Basic invitation creation and acceptance works
- Missing advanced features mentioned in plan

**Missing Features:**
- [ ] Resend invitation functionality
- [ ] Cancel invitation (partially implemented, needs UI)
- [ ] Bulk invitation support
- [ ] Invitation expiration auto-cleanup (function exists but not scheduled)
- [ ] Invitation analytics/tracking

**Action Required:**
- [ ] Add resend invitation button in UI
- [ ] Add cancel invitation button in pending invitations list
- [ ] Implement bulk invitation UI
- [ ] Set up cron job for auto-expiring invitations
- [ ] Add invitation tracking/analytics

**Priority:** Low (Nice to have)

---

## Workspace Ownership Transfer

### Status: Not Implemented
**Location:** Plan mentions this as future feature

**Current State:**
- Owner cannot remove themselves (by design)
- No way to transfer ownership
- Plan mentions: "must transfer ownership first - future feature"

**Action Required:**
- [ ] Add ownership transfer functionality
- [ ] Create transfer ownership UI
- [ ] Add confirmation dialogs
- [ ] Update permissions after transfer
- [ ] Add audit trail for ownership changes

**Priority:** Low

---

## Rate Limiting

### Status: Not Implemented
**Location:** Multiple endpoints

**Current State:**
- No rate limiting on invitations
- No rate limiting on API endpoints
- Security consideration mentions rate limiting but not implemented

**Action Required:**
- [ ] Add rate limiting middleware
- [ ] Implement rate limits for invitation creation
- [ ] Add rate limits for user search
- [ ] Add rate limits for workspace operations
- [ ] Configure rate limit thresholds

**Priority:** Medium (Security)

---

## User Search Privacy

### Status: Temporary Implementation
**Location:** `src/lib/workspaces/server.ts` (searchUserByEmail)

**Current State:**
- Uses service role to query auth.users directly
- Plan mentions: "For MVP: Use direct auth.users lookup (service role only)"
- Alternative mentioned: Create `public.user_profiles` table with opt-in visibility

**Issues:**
- Privacy concerns with direct auth.users access
- No user control over discoverability
- Service role access is powerful and should be minimized

**Action Required:**
- [ ] Consider creating `public.user_profiles` table
- [ ] Add opt-in visibility settings
- [ ] Add user privacy controls
- [ ] Minimize service role usage

**Priority:** Low (Privacy enhancement)

---

## Database Migration Auto-Expiration

### Status: Function Exists But Not Scheduled
**Location:** `supabase/migrations/20251227214257_add_workspace_invitations.sql`

**Current State:**
- `expire_old_invitations()` function exists
- Comment: "This can be called via a cron job or manually"
- No automatic scheduling set up

**Action Required:**
- [ ] Set up Supabase cron job or pg_cron
- [ ] Schedule daily execution of `expire_old_invitations()`
- [ ] Add monitoring for expiration job
- [ ] Test expiration logic

**Priority:** Low (Can be done manually for now)

---

## Console Logging in Production

### Status: Development Code in Production
**Location:** Multiple files

**Current State:**
- Many `console.log()` and `console.error()` statements
- Email service logs full invitation details to console
- Admin page has console.log for debugging

**Files:**
- `src/lib/email/invitations.ts` (lines 117-124)
- `src/components/admin/users-table.tsx` (line 590, 625)
- `src/components/admin/users-page-client.tsx` (line 12)

**Action Required:**
- [ ] Remove or conditionally disable console.log in production
- [ ] Replace with proper logging service
- [ ] Remove sensitive data from logs
- [ ] Add environment-based logging levels

**Priority:** Medium (Security/Performance)

---

## Type Safety Improvements

### Status: Some Areas Need Improvement
**Location:** Multiple files

**Current State:**
- Some `any` types used
- Some type assertions that could be improved
- Missing type definitions in some areas

**Action Required:**
- [ ] Audit and remove `any` types
- [ ] Improve type definitions
- [ ] Add stricter TypeScript configuration
- [ ] Add runtime type validation where needed

**Priority:** Low

---

## Testing

### Status: Not Implemented
**Location:** Entire codebase

**Current State:**
- No unit tests
- No integration tests
- No E2E tests
- Testing checklist exists in plan but tests not written

**Action Required:**
- [ ] Set up testing framework (Jest, Vitest, etc.)
- [ ] Add unit tests for server functions
- [ ] Add integration tests for API endpoints
- [ ] Add E2E tests for critical flows
- [ ] Add test coverage reporting

**Priority:** High (Quality assurance)

---

## Documentation

### Status: Partially Complete
**Location:** `docs/` directory

**Current State:**
- PRD exists
- Setup guides exist
- Missing API documentation
- Missing component documentation
- Missing architecture diagrams

**Action Required:**
- [ ] Add API documentation
- [ ] Add component documentation
- [ ] Create architecture diagrams
- [ ] Add developer onboarding guide
- [ ] Document deployment process

**Priority:** Medium

---

## Summary

### High Priority
1. Email service integration (required for production)
2. Testing framework and tests

### Medium Priority
3. Content upload functionality
4. Settings functionality
5. Error handling improvements
6. Rate limiting
7. Remove console logging in production
8. Documentation improvements

### Low Priority
9. Export functionality
10. Help functionality
11. User profiles table
12. Invitation management features
13. Workspace ownership transfer
14. User search privacy improvements
15. Database migration scheduling
16. Type safety improvements

---

## Notes

- This document should be updated as technical debt is addressed
- New technical debt should be added as it's identified
- Priority levels may change based on business needs
- Some items may be acceptable for MVP and can be deferred
