# Context

**AI-Powered Product Management Platform** — Transform raw product conversations, documents, and meetings into structured product roadmaps.

## Tech Stack

- **Framework:** Next.js 16+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL via Supabase
- **Auth:** Supabase Auth
- **UI Components:** Radix UI, Framer Motion, React Flow

---

## 🚀 Quick Start (Development Setup)

### Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Installation |
|------|---------|--------------|
| **Node.js** | 18.x or higher | [nodejs.org](https://nodejs.org/) |
| **Docker Desktop** | Latest | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) |
| **Supabase CLI** | Latest | `npm install -g supabase` |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

> ⚠️ **Docker Desktop must be running** before starting Supabase local development.

---

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd trycontext
```

---

### Step 2: Install Dependencies

```bash
npm install
```

---

### Step 3: Start Supabase Locally

Supabase runs locally using Docker containers. This gives you a complete local development environment with database, auth, and storage.

#### 3.1 Start Supabase Services

```bash
supabase start
```

> **First time?** This will download Docker images (~2-3GB) which may take a few minutes.

After startup, you'll see output like this:

```
         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   S3 Access Key: 625729a08b95bf1b7ff351a663f3a23c
   S3 Secret Key: 850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6edd37394bfaef6
       S3 Region: local
```

**Save these values — you'll need them for the next step!**

#### 3.2 Access Local Services

| Service | URL | Description |
|---------|-----|-------------|
| **Supabase Studio** | http://127.0.0.1:54323 | Database management dashboard |
| **API** | http://127.0.0.1:54321 | REST/GraphQL API |
| **Inbucket** | http://127.0.0.1:54324 | Email testing (view sent emails) |

---

### Step 4: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Copy the example (if available) or create a new file
touch .env.local
```

Add the following variables (use values from `supabase start` output):

```env
# Supabase (Local Development)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-anon-key-from-supabase-start>
SUPABASE_SERVICE_ROLE_KEY=<paste-service-role-key-from-supabase-start>

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> 💡 **Tip:** You can always get these values again by running `supabase status`

---

### Step 5: Run Database Migrations

Apply the database schema:

```bash
supabase db reset
```

This command:
- Resets the local database
- Applies all migrations from `supabase/migrations/`
- Seeds initial data (if configured)

---

### Step 6: Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📧 Email Testing (Local Development)

In local development, emails are **not actually sent**. Instead, they're captured by Inbucket.

To view emails (verification, password reset, etc.):

1. Open **Inbucket**: http://127.0.0.1:54324
2. Check the inbox for your test email address
3. Click on emails to view content and verification links

---

## 🛠️ Useful Commands

### Supabase Commands

```bash
# Start Supabase (Docker containers)
supabase start

# Stop Supabase
supabase stop

# View connection info
supabase status

# Reset database (apply migrations fresh)
supabase db reset

# View logs
supabase logs

# Generate TypeScript types from database schema
supabase gen types typescript --local > src/types/database.ts
```

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

---

## 📁 Project Structure

```
trycontext/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes (auth, etc.)
│   │   ├── actions/            # Server actions (workspaces, flow)
│   │   ├── admin/              # Admin portal pages
│   │   ├── org/                # Organization portal pages
│   │   ├── signin/             # Authentication pages
│   │   ├── signup/
│   │   └── ...
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI components
│   │   ├── portals/            # Portal layouts
│   │   ├── org/                # Organization-specific components
│   │   │   ├── flow-canvas.tsx # React Flow canvas
│   │   │   ├── header.tsx      # Workspace switcher header
│   │   │   └── ...
│   │   └── admin/              # Admin-specific components
│   ├── contexts/               # React contexts
│   ├── hooks/                  # Custom React hooks
│   │   └── use-workspace.ts    # Workspace management hook
│   ├── lib/                    # Utility functions & configurations
│   │   ├── supabase/           # Supabase client setup
│   │   ├── auth/               # Authentication utilities
│   │   ├── workspaces/         # Workspace server functions
│   │   ├── flow/               # Flow data server functions
│   │   └── ...
│   └── types/                  # TypeScript type definitions
├── supabase/
│   ├── config.toml             # Supabase local configuration
│   └── migrations/             # Database migrations
│       └── *_create_workspaces_and_flow_tables.sql
├── public/                     # Static assets
├── docs/                       # Documentation
└── package.json
```

## 🏢 Workspace Architecture

The application uses a **workspace-based multi-tenancy model**:

- **Each user can have multiple workspaces** - Switch between workspaces via Cmd+K (or Ctrl+K)
- **Direct hierarchy:** Workspace → Epics → Stories → Tasks (no intermediate "Projects" layer)
- **Isolated data:** Each workspace maintains its own epics, stories, tasks, and content
- **Visual flow canvas:** Epics, stories, and tasks are displayed on a React Flow canvas with hierarchical layout
- **Workspace creation:** Create new workspaces directly from the workspace switcher dialog

---

## 🔧 Troubleshooting

### Docker Not Running

```
Error: Cannot connect to Docker daemon
```

**Solution:** Start Docker Desktop and wait for it to fully initialize.

### Port Already in Use

```
Error: Port 54321 is already in use
```

**Solution:** 
1. Stop other services using the port, or
2. Modify ports in `supabase/config.toml`

### Supabase Start Fails

```bash
# Reset everything and try again
supabase stop --no-backup
supabase start
```

### Database Connection Issues

```bash
# Check Supabase status
supabase status

# Verify containers are running
docker ps
```

### Can't Receive Verification Emails

Remember: In local development, emails go to **Inbucket**, not your actual email.
- Open http://127.0.0.1:54324
- Check the inbox for your test email

---

## 🌐 Production Setup

When deploying to production:

1. **Create a Supabase Project** at [supabase.com](https://supabase.com)
2. **Update environment variables** with production credentials
3. **Configure email** (enable SMTP in Supabase dashboard)
4. **Set up OAuth providers** (Google, GitHub, etc.) with production redirect URLs
5. **Apply migrations** to production database via Supabase dashboard

---

## 📚 Additional Documentation

- [Product Requirements (PRD)](./docs/PRD.md) — Full product specification
- [Setup Guide](./docs/SETUP_GUIDE.md) — Detailed setup instructions
- [Supabase Setup](./docs/SUPABASE_SETUP.md) — Supabase-specific configuration

---

## 🔗 External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
