# Product Requirements Document (PRD)
## Context - AI-Powered Product Management Platform

**Version:** 1.0  
**Date:** 2024  
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Product Vision
Context is a multi-tenant SaaS platform that transforms raw product conversations, documents, and meetings into structured product roadmaps. The platform acts as an AI-powered Product Owner/Product Manager, analyzing user-uploaded content (transcriptions, documents, images) and automatically generating organized epics, tickets, and planning within Linear.

### 1.2 Problem Statement
Product managers and product teams spend countless hours:
- Transcribing and organizing meeting notes
- Manually creating tickets and epics from conversations
- Maintaining context across multiple documents and discussions
- Identifying knowledge gaps that need clarification

Context automates this workflow, allowing teams to focus on strategic decisions rather than administrative work.

### 1.3 Target Users
- **Primary:** Product Managers and Product Owners
- **Secondary:** Engineering Leads, Startup Founders, Product Teams
- **Tertiary:** Agencies managing multiple client products

### 1.4 Success Metrics
- **Time to First Ticket:** < 5 minutes from content upload to draft ticket creation
- **Ticket Quality:** User edits required on < 20% of AI-generated content
- **Adoption Rate:** > 80% of uploaded content generates actionable tickets
- **User Retention:** > 60% of users active after 30 days

---

## 2. User Personas

### 2.1 Primary Persona: Product Manager (Sarah)
- **Role:** Senior Product Manager at a mid-size tech company
- **Pain Points:** 
  - Spending 40% of time on administrative work (tickets, documentation)
  - Struggling to maintain context across multiple stakeholder meetings
  - Difficulty identifying gaps in requirements before development starts
- **Goals:**
  - Quickly convert client conversations into actionable roadmap items
  - Ensure all context is captured and linked to tickets
  - Identify knowledge gaps proactively

### 2.2 Secondary Persona: Startup Founder (Alex)
- **Role:** Technical founder managing product and engineering
- **Pain Points:**
  - Limited time for detailed ticket creation
  - Needs to capture ideas and conversations efficiently
  - Managing multiple product areas simultaneously
- **Goals:**
  - Rapidly prototype product ideas based on customer feedback
  - Maintain organized roadmap with minimal overhead
  - Ensure nothing falls through the cracks

---

## 3. Product Requirements

### 3.1 Authentication & User Management

#### 3.1.1 Authentication Methods
- **Email/Password:** Standard email-based authentication
- **Google SSO:** One-click sign-in with Google account
- **Requirements:**
  - Secure password hashing (bcrypt/argon2)
  - Email verification for new accounts
  - Password reset functionality
  - Session management (JWT or similar)

#### 3.1.2 Multi-Tenancy Model
- **Workspace-Based Architecture:**
  - Each user can belong to multiple workspaces
  - Each workspace represents a client/product organization
  - One workspace = one Linear project (simplified for MVP)
  - Workspace owners can invite team members
  - **Data Hierarchy:** Workspace → Epics → Stories → Tasks (direct relationship, no intermediate "Projects" layer)
  - **Workspace Creation:** Users can create workspaces via the workspace switcher dialog (Cmd+K) in the header

#### 3.1.3 Team Collaboration & Permissions
- **Roles:**
  - **Owner:** Full access, billing management, workspace deletion
  - **Admin:** Full project access, member management, Linear integration setup
  - **Member:** Can create projects, upload content, edit tickets (draft stage)
  - **Viewer:** Read-only access to projects and content
- **Permission Scope:** Project-level permissions (future: content-level granularity)

#### 3.1.4 Pricing Model
- **Free Tier:**
  - 1 workspace
  - 3 projects
  - 50MB storage per project
  - Basic AI analysis
  - Limited to 10 Linear tickets per month
- **Paid Tier (Details TBD):**
  - Multiple workspaces
  - Unlimited projects
  - Larger storage quotas
  - Advanced AI features
  - Unlimited Linear syncs
  - Priority processing

---

## 3.2 Content Ingestion & Processing

### 3.2.1 Supported Content Types

#### Phase 1 (MVP):
- **Transcriptions:**
  - Direct file upload (TXT, SRT, VTT formats)
  - Users upload pre-transcribed files
  - Supported via Supabase Storage
- **Documents:**
  - PDF files
  - Markdown (.md)
  - Plain text (.txt)
- **Images:**
  - PNG, JPG, JPEG formats
  - Screenshots, mockups, diagrams

#### Future Phases:
- **URL Import:** Import from Notion, Confluence, Google Docs
- **API Integrations:** Zoom, Google Meet, Microsoft Teams transcriptions
- **Additional Formats:** Word documents, PowerPoint, CSV
- **OCR:** Extract text from scanned documents/images

### 3.2.2 Storage & Processing
- **Storage:** Supabase Storage (organized by workspace → project → content type)
- **Processing Strategy:** Batch processing with priority queue
  - **Priority Levels:**
    1. Manual triggers (user-initiated re-analysis)
    2. New uploads (automatic processing)
    3. Scheduled re-analysis (background updates)
  - **Status Tracking:** `uploaded` → `queued` → `processing` → `analyzed` → `ready`
  - **Background Jobs:** BullMQ or similar queue system
  - **Real-time Updates:** Supabase Realtime for status notifications

### 3.2.3 Content Organization
- **Project Structure:**
  - Each project contains multiple content items
  - Tags (auto-generated + user-created)
  - Content linking (bidirectional references)
  - Versioning: Timestamped content (no overwrite)
- **Content Relationships:**
  - Graph view showing connections between content items
  - Traceability: Content → Epics → Tickets (bidirectional links)
  - Semantic search via vector embeddings (LangChain)

---

## 3.3 AI & LLM Integration

### 3.3.1 LLM Provider & Configuration
- **Provider:** OpenAI
- **Model:** Single model for all tasks (GPT-4 or GPT-4 Turbo recommended)
- **Context Management:**
  - Maximum context window utilization
  - Vector database (embeddings) for large document sets
  - LangChain for RAG (Retrieval-Augmented Generation)
  - Chunking strategy for documents exceeding token limits

### 3.3.2 AI Analysis Pipeline
1. **Content Ingestion:** Upload → Store in Supabase
2. **Text Extraction:** Extract text from PDFs, images (OCR)
3. **Embedding Generation:** Create vector embeddings for all content
4. **Context Retrieval:** Use RAG to retrieve relevant context for analysis
5. **AI Analysis:** 
   - Identify themes and capabilities
   - Generate epics and tickets
   - Create planning suggestions
   - Identify knowledge gaps
6. **Draft Generation:** Create draft Linear items (epics, tickets)

### 3.3.3 Cost Management
- **Pricing Model:** Based on context size (token usage)
- **Optimization:**
  - Caching frequently accessed embeddings
  - Batch processing to optimize API calls
  - Smart chunking to minimize redundant processing
- **Usage Tracking:** Per-workspace token usage monitoring

---

## 3.4 Linear Integration

### 3.4.1 Connection Model
- **Workspace-Level Connection:** Each workspace connects to one Linear project
- **Authentication:** Linear API key stored securely per workspace
- **One Linear Project per Workspace:** 1:1 mapping (simplified for MVP)

### 3.4.2 Ticket & Epic Generation

#### Epic Structure:
- **Hierarchical Analysis:** AI analyzes all content to identify themes/capabilities
- **Epic Derivation:** Major features/capabilities become epics
- **Issue Creation:** Specific work items under each epic
- **Linking:** Each epic/ticket references source content IDs for traceability

#### Generation Triggers:
- **Automatic:** On content ingestion completion
- **Manual:** User-triggered re-analysis button
- **Granularity:** AI-determined (can range from single ticket to epic-level items)

#### Ticket Attributes:
- **Auto-tagging:** AI-generated labels based on content analysis
- **Estimation:** Story points or time estimates (AI-suggested)
- **Priority:** AI-assigned priority levels
- **Dependencies:** AI-identified dependencies between tickets
- **Milestones:** AI-suggested milestones and timelines

### 3.4.3 Sync Workflow
- **Two-Phase Approach:**
  1. **Draft Generation:** AI creates draft epics/tickets (stored in Context)
  2. **User Review:** User reviews, edits, and approves
  3. **Linear Sync:** Approved items sync to Linear (one-way: Context → Linear)
- **Sync Status:**
  - Real-time status indicators (synced, pending, error)
  - Manual sync trigger button
  - Error handling and retry logic

### 3.4.4 Planning & Timeline Management
- **AI-Generated Planning:**
  - Epics with suggested timelines
  - Ticket prioritization
  - Dependency mapping
  - Milestone suggestions
- **User Control:** All AI suggestions are editable before Linear sync

---

## 3.5 Knowledge Gap Identification

### 3.5.1 Gap Detection Logic
- **Confidence Scoring:** Each gap identified with confidence level (High/Medium/Low)
- **Detection Criteria:**
  - Missing details preventing ticket creation
  - Ambiguous requirements
  - Contradictory information
  - Unclear user flows or edge cases

### 3.5.2 Gap Presentation
- **Format:** Separate "Knowledge Gaps" panel in project view
- **Organization:**
  - Grouped by Epic/Issue
  - Sorted by confidence score
  - Categorized by missing info type (requirements, edge cases, user flows, etc.)
- **Prioritization:**
  1. **High Confidence:** Blocking ticket creation or critical details
  2. **Medium Confidence:** Affecting ticket quality or completeness
  3. **Low Confidence:** Suggestions for improvement

### 3.5.3 Gap Resolution
- **Actions Available:**
  - Mark as "answered" (with optional note)
  - Mark as "deferred" (low priority)
  - Add follow-up content (link transcription or document)
  - Create question card for follow-up meeting
- **Auto-Update:** When new content is added, AI re-analyzes and updates gap status

---

## 3.6 User Interface & Experience

### 3.6.1 Design Principles
- **Inspiration:** Vercel, Cursor, Linear, Graphite UI aesthetics
- **Key Characteristics:**
  - Clean, minimalist design
  - Dark mode support (primary)
  - Smooth animations and transitions
  - Responsive layout (desktop-first, mobile support)

### 3.6.2 Onboarding Flow
- **Guided Tour:** Interactive walkthrough of key features
- **Sample Project:** Pre-populated example project with sample content
- **Blank Slate Option:** Skip tour, start fresh

### 3.6.3 Main Views

#### Workspace View (Primary Interface):
- **Flow Canvas:** Visual representation of epics, stories, and tasks using React Flow
  - Hierarchical layout with epics containing stories, stories containing tasks
  - Drag-and-drop node positioning
  - Auto-layout feature for organizing nodes
  - Pan and zoom controls
  - Node selection and editing
- **Workspace Switcher:** 
  - Accessible via Cmd+K (or Ctrl+K) keyboard shortcut
  - Shows all user workspaces
  - Create new workspace option in dialog
  - Quick switch between workspaces
- **Content Panel:** Side panel showing uploaded content organized by folders
- **Toolbar:** Actions for creating epics, stories, tasks, uploading content, and managing layout

#### Workspace Organization:
- **Direct Hierarchy:** Workspace → Epics → Stories → Tasks
  - No intermediate "Projects" layer (simplified for MVP)
  - Each workspace maintains its own isolated context
  - All epics, stories, tasks, and content are workspace-scoped
- **Content Management:**
  - Content organized in folders within workspace
  - Content can be linked to multiple epics/stories/tasks
  - Full-text and semantic search across workspace content
- **Knowledge Gaps:**
  - Identified gaps linked to specific epics/stories/tasks
  - Filter by confidence, status, epic
  - Resolve or defer gaps
- **Settings:**
  - Linear integration configuration (per workspace)
  - Workspace settings
  - Team members and permissions

### 3.6.4 Content Ingestion Flow
- **Method:** Drag-and-drop zone + file picker
- **Features:**
  - Batch upload support
  - Preview before processing
  - Progress indicators
  - Upload queue management
- **Processing Status:** Real-time updates via Supabase Realtime

### 3.6.5 Linear Sync Interface
- **Sync Status Indicator:** Visual status (synced, pending, error)
- **Manual Sync Button:** Trigger sync for approved items
- **Sync History:** Log of sync operations with timestamps

---

## 3.7 Workflow States & Status

### 3.7.1 Content States
```
uploaded → queued → processing → analyzed → ready
                                    ↓
                              (error) → failed → retry
```

### 3.7.2 Ticket Lifecycle
```
draft (AI-generated) → review (user edits) → approved → synced_to_linear
                              ↓
                        (rejected) → deleted
```

### 3.7.3 Project States
- **Active:** Normal operation, content can be added
- **Archived:** View-only, no new content, hidden from main dashboard

---

## 4. Technical Requirements

### 4.1 Technology Stack

#### Frontend:
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **UI Library:** React
- **Styling:** Tailwind CSS (recommended for Vercel-inspired design)
- **State Management:** React Context or Zustand (TBD)

#### Backend:
- **API:** Next.js API Routes
- **Worker Service:** Separate Node.js service for background processing
- **Language:** TypeScript/Node.js

#### Database:
- **Primary:** PostgreSQL (via Supabase)
- **Vector DB:** Supabase pgvector extension OR separate vector database (Pinecone/Weaviate)

#### Storage:
- **File Storage:** Supabase Storage
- **Organization:** `workspace/{workspaceId}/{contentType}/{fileId}` (simplified, no project layer)

#### Background Jobs:
- **Queue System:** BullMQ (Redis-based)
- **Worker:** Node.js worker processes

#### Real-time:
- **Technology:** Supabase Realtime
- **Use Cases:** Processing status, sync status, team collaboration (future)

#### AI/ML:
- **LLM:** OpenAI API
- **Framework:** LangChain (for RAG, embeddings, document processing)
- **Embeddings:** OpenAI text-embedding-3-small or similar

### 4.2 Security & Privacy

#### Encryption:
- **At Rest:** Supabase handles database encryption
- **In Transit:** HTTPS/TLS for all communications
- **API Keys:** Encrypted storage for Linear API keys (Supabase Vault)

#### Compliance:
- **GDPR Ready:** User data export, right to deletion, consent management
- **Future:** SOC 2 compliance planning

#### Data Retention:
- **User-Controlled Deletion:** Users can delete workspaces, projects, content
- **Cascade Logic:** Decide on Linear item deletion (sync disconnect vs. delete)
- **Soft Deletes:** Implement soft delete for audit trail

#### Access Control:
- **Role-Based Access Control (RBAC):** Owner, Admin, Member, Viewer
- **Project-Level Permissions:** Granular controls per project
- **API Security:** JWT-based authentication, rate limiting

### 4.3 API Specifications

#### Internal APIs (Next.js API Routes):
- `/api/auth/*` - Authentication endpoints
- `/api/workspaces/*` - Workspace management
- `/api/projects/*` - Project CRUD operations
- `/api/content/*` - Content upload and management
- `/api/analysis/*` - Trigger analysis, get results
- `/api/linear/*` - Linear sync operations
- `/api/gaps/*` - Knowledge gaps management

#### External Integrations:
- **Linear API:** REST API for project, epic, issue management
- **OpenAI API:** GPT-4 for analysis, embeddings API for vector search
- **Supabase API:** Storage, database, real-time subscriptions

---

## 5. Data Model (High-Level)

### 5.1 Core Entities

#### Workspace
- `id` (UUID)
- `name` (string)
- `linear_api_key` (encrypted)
- `linear_project_id` (string)
- `owner_id` (UUID, FK to User)
- `created_at`, `updated_at`

#### User
- `id` (UUID)
- `email` (string, unique)
- `name` (string)
- `avatar_url` (string, nullable)
- `created_at`, `updated_at`

#### WorkspaceMember
- `id` (UUID)
- `workspace_id` (UUID, FK)
- `user_id` (UUID, FK)
- `role` (enum: Owner, Admin, Member, Viewer)
- `created_at`, `updated_at`

#### UserWorkspacePreferences
- `user_id` (UUID, PK, FK to User)
- `workspace_id` (UUID, FK) - Current active workspace for user
- `created_at`, `updated_at`

#### Content
- `id` (UUID)
- `workspace_id` (UUID, FK) - Direct workspace relationship
- `type` (enum: transcription, document, image)
- `file_url` (string, Supabase Storage URL)
- `file_name` (string)
- `file_size` (integer)
- `status` (enum: uploaded, queued, processing, analyzed, ready, failed)
- `metadata` (JSONB - type-specific metadata)
- `created_at`, `updated_at`

#### ContentText (Extracted text)
- `id` (UUID)
- `content_id` (UUID, FK)
- `text` (text)
- `chunks` (JSONB - vector chunks)
- `created_at`, `updated_at`

#### ContentEmbedding
- `id` (UUID)
- `content_id` (UUID, FK)
- `chunk_index` (integer)
- `embedding` (vector)
- `created_at`

#### Epic (Draft)
- `id` (UUID)
- `workspace_id` (UUID, FK) - Direct workspace relationship
- `title` (string)
- `description` (text)
- `status` (enum: draft, approved, synced)
- `content_ids` (UUID[], array of content IDs)
- `position_x`, `position_y` (double precision) - React Flow canvas positions
- `created_at`, `updated_at`

#### Story (Draft)
- `id` (UUID)
- `workspace_id` (UUID, FK) - Direct workspace relationship
- `epic_id` (UUID, FK, nullable) - Optional parent epic
- `title` (string)
- `description` (text)
- `status` (enum: draft, approved, synced)
- `content_ids` (UUID[], array of content IDs)
- `position_x`, `position_y` (double precision) - React Flow canvas positions
- `created_at`, `updated_at`

#### Task (Draft)
- `id` (UUID)
- `workspace_id` (UUID, FK) - Direct workspace relationship
- `story_id` (UUID, FK, nullable) - Parent story
- `title` (string)
- `description` (text)
- `priority` (enum: low, medium, high, urgent)
- `status` (enum: draft, review, approved, synced)
- `content_ids` (UUID[], array of content IDs)
- `position_x`, `position_y` (double precision) - React Flow canvas positions
- `created_at`, `updated_at`

#### KnowledgeGap
- `id` (UUID)
- `workspace_id` (UUID, FK) - Direct workspace relationship
- `epic_id` (UUID, FK, nullable)
- `story_id` (UUID, FK, nullable)
- `task_id` (UUID, FK, nullable)
- `question` (text)
- `confidence` (enum: High, Medium, Low)
- `category` (string - requirements, edge_cases, user_flows, etc.)
- `status` (enum: open, answered, deferred)
- `resolved_at` (timestamp, nullable)
- `created_at`, `updated_at`

### 5.2 Relationships
- Workspace → Epics (1:many) - Direct relationship, no Projects layer
- Workspace → Stories (1:many) - Stories can optionally belong to an Epic
- Workspace → Tasks (1:many) - Tasks belong to a Story
- Workspace → Content (1:many) - Content directly belongs to workspace
- Epic → Stories (1:many) - Optional relationship
- Story → Tasks (1:many) - Tasks belong to stories
- Content → ContentText (1:1)
- Content → ContentEmbedding (1:many)
- Epic/Story/Task → Content (many:many via content_ids arrays)
- Epic/Story/Task → KnowledgeGaps (1:many)

---

## 6. User Flows

### 6.1 New User Onboarding
1. User signs up (email/Google)
2. Guided tour (optional)
3. System automatically creates default workspace ("My Workspace")
4. User can create additional workspaces via workspace switcher (Cmd+K)
5. Connect Linear project (API key input) - per workspace
6. Upload content or start creating epics/stories/tasks directly

### 6.2 Content Upload & Analysis Flow
1. User navigates to workspace (flow canvas view)
2. Drag-and-drop content files via toolbar or content panel
3. Files upload to Supabase Storage (workspace-scoped)
4. Content status: `uploaded`
5. Background job processes content (status: `processing`)
6. AI analyzes content using LangChain + OpenAI
7. Draft epics/stories/tasks generated (status: `analyzed`)
8. Knowledge gaps identified and linked to relevant nodes
9. User notified via real-time update
10. User reviews drafts on flow canvas, can edit/approve/delete nodes

### 6.3 Linear Sync Flow
1. User reviews AI-generated epics/stories/tasks on flow canvas
2. User edits/approves drafts (can modify title, description, status, priority)
3. User clicks "Sync to Linear" button (per node or batch)
4. System creates epics/issues in Linear via API
5. Status updates to `synced`
6. Linear IDs stored for reference (future: linear_epic_id, linear_issue_id fields)
7. User can view synced items in Linear

### 6.4 Knowledge Gap Resolution Flow
1. User views "Knowledge Gaps" tab
2. User sees gaps sorted by confidence
3. User can:
   - Answer gap directly (add note)
   - Upload follow-up content (transcription)
   - Mark as deferred
   - Create question card for meeting
4. System re-analyzes if new content added
5. Gap status updates accordingly

---

## 7. MVP Scope

### 7.1 Included in MVP (v1.0)

✅ **Core Features:**
- User authentication (email + Google SSO)
- Workspace creation and management (via header dialog, Cmd+K)
- Workspace switching with isolated data per workspace
- Direct workspace → epics/stories/tasks hierarchy
- Flow canvas visualization (React Flow) with hierarchical node layout
- Content upload (transcriptions, PDFs, images) - workspace-scoped
- Batch processing with queue system
- AI analysis pipeline (OpenAI + LangChain)
- Draft epic/story/task generation
- Linear API integration (one-way sync)
- Knowledge gap identification with confidence scoring
- Basic search (full-text)
- Content linking via content_ids arrays
- Role-based permissions (Owner, Admin, Member, Viewer)

✅ **UI Features:**
- Workspace flow canvas with visual node representation
- Workspace switcher dialog (Cmd+K) with create option
- Header with workspace selector, zoom controls, and user menu
- Toolbar for creating nodes (epics, stories, tasks) and managing layout
- Content panel for organizing uploaded files
- Drag-and-drop content upload
- Real-time status updates
- Linear sync interface (per node or batch)
- Auto-layout feature for organizing flow nodes

### 7.2 Excluded from MVP (Future Phases)

❌ **Advanced Features:**
- Real-time collaboration (multi-user editing)
- Multiple Linear projects per workspace
- Bidirectional Linear sync
- Advanced planning features (timeline view, sprint planning)
- URL imports (Notion, Confluence)
- API integrations (Zoom, Google Meet)
- Graph view of content relationships
- Advanced semantic search UI
- Custom AI prompt templates
- A/B testing for prompts
- Webhook support
- Public API for third-party integrations
- Mobile app

---

## 8. Success Metrics & KPIs

### 8.1 Product Metrics
- **Time to First Ticket:** < 5 minutes from upload to draft ticket
- **Ticket Quality Score:** < 20% of AI-generated content requires user edits
- **Content Processing Success Rate:** > 95% of uploads successfully processed
- **Linear Sync Success Rate:** > 98% of approved items sync successfully

### 8.2 User Adoption Metrics
- **Activation Rate:** > 60% of signups create first project
- **Retention Rate (D7):** > 40% of users active after 7 days
- **Retention Rate (D30):** > 30% of users active after 30 days
- **Engagement:** Average 3+ projects created per active user

### 8.3 Business Metrics
- **Free-to-Paid Conversion:** Target 10% conversion rate
- **Monthly Recurring Revenue (MRR):** Track post-launch
- **Customer Acquisition Cost (CAC):** Track post-launch
- **Net Promoter Score (NPS):** Target > 50

---

## 9. Risk Assessment & Mitigation

### 9.1 Technical Risks
- **Risk:** OpenAI API rate limits or downtime
  - **Mitigation:** Queue system with retries, graceful degradation
- **Risk:** Large file processing timeouts
  - **Mitigation:** Chunking strategy, async processing, progress tracking
- **Risk:** Vector database performance at scale
  - **Mitigation:** Index optimization, consider separate vector DB service

### 9.2 Product Risks
- **Risk:** AI generates low-quality tickets
  - **Mitigation:** User review step, feedback loop, continuous prompt improvement
- **Risk:** Linear API changes break integration
  - **Mitigation:** Version pinning, comprehensive error handling, monitoring

### 9.3 Business Risks
- **Risk:** High OpenAI costs at scale
  - **Mitigation:** Cost optimization (caching, batching), usage-based pricing
- **Risk:** Low user adoption
  - **Mitigation:** Strong onboarding, clear value proposition, user feedback

---

## 10. Future Roadmap (Post-MVP)

### Phase 2 (v1.1-1.3)
- Multiple Linear projects per workspace
- Advanced planning features (timelines, dependencies)
- Graph view of content relationships
- Enhanced semantic search UI
- Custom AI prompt templates

### Phase 3 (v2.0)
- Real-time collaboration features
- URL imports (Notion, Confluence, Google Docs)
- API integrations (Zoom, Google Meet)
- Bidirectional Linear sync
- Webhook support

### Phase 4 (v2.1+)
- Public REST API
- Additional integrations (Jira, GitHub Issues)
- Mobile app
- Advanced analytics and insights
- AI model fine-tuning

---

## 11. Appendices

### 11.1 Glossary
- **Epic:** A large feature or capability that spans multiple tickets
- **Ticket/Issue:** A specific work item or task
- **Knowledge Gap:** Missing information identified by AI that prevents complete ticket creation
- **Workspace:** A tenant/organization in the multi-tenant system
- **Project:** A container for content and tickets, mapped to one Linear project
- **RAG:** Retrieval-Augmented Generation - AI technique combining search with generation

### 11.2 References
- Linear API Documentation: https://developers.linear.app/docs
- OpenAI API Documentation: https://platform.openai.com/docs
- LangChain Documentation: https://python.langchain.com/docs/get_started/introduction
- Supabase Documentation: https://supabase.com/docs

---

**Document End**
