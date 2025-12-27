# Supabase Local Setup Guide

This guide will help you set up Supabase locally for development.

## Prerequisites

1. **Docker Desktop** (or Docker Engine) must be installed and running
2. **Supabase CLI** installed globally:
   ```bash
   npm install -g supabase
   ```

## Setup Steps

### 1. Initialize Supabase Project

In your project root directory, run:

```bash
supabase init
```

This creates a `supabase` directory with configuration files.

### 2. Start Local Supabase

```bash
supabase start
```

**Note:** The first time you run this command, it will download Docker images (~2-3GB). This may take a few minutes.

After starting, the CLI will output connection details including:
- API URL (typically `http://localhost:54321`)
- Anon key
- Service role key
- Studio URL (typically `http://localhost:54323`)

### 3. Configure Environment Variables

Create a `.env.local` file in the project root and add the values from the CLI output:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<copy-from-cli-output>
SUPABASE_SERVICE_ROLE_KEY=<copy-from-cli-output>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Access Supabase Studio

Open your browser and navigate to:
```
http://localhost:54323
```

This is your local Supabase dashboard where you can:
- View and manage your database
- Test authentication
- View logs
- Manage storage buckets

### 5. Configure Authentication Providers

In Supabase Studio (local dashboard):

1. Go to **Authentication** → **Providers**
2. **Email** provider is enabled by default
3. To enable **Google OAuth**:
   - Enable the Google provider
   - Add your Google OAuth credentials (Client ID and Client Secret)
   - Set redirect URL: `http://localhost:3000/api/auth/callback`

### 6. Email Configuration (Local Development)

For local development, Supabase uses a built-in email service. Verification and password reset emails will be logged in the Supabase Studio under **Authentication** → **Users** → **Email Templates**.

**Note:** In local development, you won't receive actual emails. Instead, check the Supabase logs or use the email templates section to see what emails would be sent.

## Useful Commands

```bash
# Start Supabase
supabase start

# Stop Supabase
supabase stop

# Reset database (clears all data)
supabase db reset

# View logs
supabase logs

# Check status
supabase status
```

## Troubleshooting

### Docker Not Running
If you see errors about Docker, make sure Docker Desktop is running.

### Port Already in Use
If ports 54321 or 54323 are already in use, you can change them in `supabase/config.toml`.

### Reset Everything
If something goes wrong, you can reset:
```bash
supabase stop
supabase start
```

## Next Steps

After setting up Supabase locally:

1. Test the authentication flow:
   - Sign up with email
   - Check Supabase Studio for verification email
   - Sign in
   - Test password reset

2. Configure Google OAuth (optional):
   - Get OAuth credentials from Google Cloud Console
   - Add them to Supabase Studio

3. Start developing:
   ```bash
   npm run dev
   ```

## Production Setup

When ready for production:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Update `.env.local` with production credentials
3. Configure production email settings
4. Set up production OAuth redirect URLs
