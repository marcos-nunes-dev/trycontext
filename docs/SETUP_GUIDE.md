# Setup & Development Guide
## Context - Getting Started

**Version:** 1.0  
**Date:** 2024

---

## Prerequisites

- **Node.js:** 18.x or higher
- **npm** or **pnpm** (recommended)
- **Git**
- **Supabase Account:** [supabase.com](https://supabase.com)
- **OpenAI API Key:** [platform.openai.com](https://platform.openai.com)
- **Redis:** Local instance or cloud (Upstash, Redis Cloud)
- **Linear Account** (for testing integrations)

---

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd context
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# OR using pnpm (recommended)
pnpm install
```

### 3. Environment Variables

Create `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Redis (for BullMQ)
REDIS_URL=redis://localhost:6379
# OR for Upstash:
# REDIS_URL=redis://default:password@upstash-url:port

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_here

# Optional (for development)
LINEAR_API_KEY=your_linear_api_key_for_testing
```

### 4. Supabase Setup

#### 4.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note down your project URL and API keys

#### 4.2 Enable Extensions

In Supabase SQL Editor, run:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension (for embeddings)
CREATE EXTENSION IF NOT EXISTS "vector";
```

#### 4.3 Run Database Migrations

Run the migration SQL files in order:

1. `supabase/migrations/001_create_tables.sql`
2. `supabase/migrations/002_create_indexes.sql`
3. `supabase/migrations/003_create_functions.sql`
4. `supabase/migrations/004_enable_rls.sql`
5. `supabase/migrations/005_create_policies.sql`

#### 4.4 Configure Storage Bucket

1. Go to Storage in Supabase dashboard
2. Create bucket: `context-content`
3. Set bucket to **Public** (or configure RLS policies)
4. Configure CORS if needed

#### 4.5 Configure Authentication

1. Go to Authentication → Providers
2. Enable Email provider
3. Enable Google provider (configure OAuth credentials)
4. Set up email templates (optional)

### 5. Redis Setup

#### Option A: Local Redis

```bash
# Install Redis (macOS)
brew install redis

# Install Redis (Ubuntu/Debian)
sudo apt-get install redis-server

# Start Redis
redis-server

# Redis will run on localhost:6379
```

#### Option B: Upstash (Cloud)

1. Go to [upstash.com](https://upstash.com)
2. Create Redis database
3. Copy connection URL
4. Add to `.env.local` as `REDIS_URL`

### 6. Start Development Servers

#### Terminal 1: Next.js Frontend

```bash
npm run dev
# OR
pnpm dev
```

App runs on `http://localhost:3000`

#### Terminal 2: Background Worker

```bash
npm run worker
# OR
pnpm worker
```

Worker processes background jobs (content processing, AI analysis, Linear sync).

---

## Project Structure

```
context/
├── apps/
│   ├── web/                    # Next.js frontend application
│   │   ├── app/                # App Router pages
│   │   ├── components/         # React components
│   │   ├── lib/                # Utility functions
│   │   ├── api/                # API route handlers
│   │   └── types/              # TypeScript types
│   └── worker/                 # Background worker service
│       ├── jobs/               # Job definitions
│       ├── processors/         # Job processors
│       └── services/           # External service clients
├── packages/
│   ├── shared/                 # Shared code
│   │   ├── types/              # Shared TypeScript types
│   │   └── utils/              # Shared utilities
│   ├── database/               # Database schema & migrations
│   │   └── migrations/
│   └── ai/                     # AI processing logic
│       ├── prompts/            # AI prompt templates
│       └── processors/         # Content processors
├── docs/                       # Documentation
├── .env.local                  # Environment variables (gitignored)
└── package.json
```

---

## Development Workflow

### Running Locally

1. **Start Supabase Local Development** (optional, if using Supabase CLI)
   ```bash
   supabase start
   ```

2. **Start Redis**
   ```bash
   redis-server
   ```

3. **Start Next.js Dev Server**
   ```bash
   npm run dev
   ```

4. **Start Worker** (separate terminal)
   ```bash
   npm run worker
   ```

### Database Migrations

When making schema changes:

1. Create new migration file:
   ```
   supabase/migrations/006_your_migration_name.sql
   ```

2. Write SQL:
   ```sql
   -- Your migration SQL here
   ```

3. Apply to local database (if using Supabase CLI):
   ```bash
   supabase db reset
   ```

4. Apply to remote database via Supabase dashboard SQL Editor

### Code Organization

- **Frontend:** React components in `apps/web/components/`
- **API Routes:** Next.js API routes in `apps/web/app/api/`
- **Background Jobs:** Job definitions in `apps/worker/jobs/`
- **Shared Types:** TypeScript interfaces in `packages/shared/types/`

---

## Testing Setup

### Running Tests

```bash
# Unit tests (future)
npm run test

# E2E tests (future)
npm run test:e2e
```

### Manual Testing

1. **Authentication Flow**
   - Sign up with email
   - Sign in with Google
   - Test password reset

2. **Content Upload**
   - Upload transcription file
   - Upload PDF document
   - Upload image
   - Check processing status

3. **AI Analysis**
   - Wait for content processing
   - Verify epics/tickets generated
   - Check knowledge gaps identified

4. **Linear Sync**
   - Configure Linear API key
   - Approve epics/tickets
   - Sync to Linear
   - Verify items created in Linear

---

## Common Issues

### Issue: Redis Connection Error

**Solution:**
- Check Redis is running: `redis-cli ping` (should return `PONG`)
- Verify `REDIS_URL` in `.env.local`
- Check firewall/network settings

### Issue: Supabase Connection Error

**Solution:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and keys are correct
- Check Supabase project is active
- Verify network connectivity

### Issue: OpenAI API Errors

**Solution:**
- Verify `OPENAI_API_KEY` is set correctly
- Check API key has sufficient credits
- Verify rate limits aren't exceeded
- Check API key permissions

### Issue: pgvector Extension Not Found

**Solution:**
- Run: `CREATE EXTENSION IF NOT EXISTS "vector";` in Supabase SQL Editor
- Verify extension is enabled in database

### Issue: File Upload Fails

**Solution:**
- Check Supabase Storage bucket exists
- Verify bucket is configured correctly
- Check file size limits
- Verify RLS policies allow uploads

---

## Environment-Specific Configuration

### Development

- Use local Redis instance
- Use Supabase project (dev environment)
- Enable detailed logging
- Use test OpenAI API key (with rate limits)

### Staging

- Use cloud Redis (Upstash)
- Use separate Supabase project
- Enable error tracking (Sentry)
- Use production OpenAI API key

### Production

- Use cloud Redis (Upstash or Redis Cloud)
- Use production Supabase project
- Enable all monitoring
- Use production OpenAI API key
- Configure CDN for static assets

---

## Useful Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run worker
npm run worker

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

---

## Next Steps

1. **Read Documentation:**
   - [PRD.md](./PRD.md) - Product requirements
   - [TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md) - Architecture
   - [API_SPECIFICATION.md](./API_SPECIFICATION.md) - API docs

2. **Set Up IDE:**
   - Install ESLint extension
   - Install Prettier extension
   - Configure TypeScript settings

3. **Start Development:**
   - Create your first feature branch
   - Follow coding standards
   - Write tests (when framework is set up)

---

**Document End**
