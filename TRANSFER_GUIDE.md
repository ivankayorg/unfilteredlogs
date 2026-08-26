# UNFILTERED LOG V2 - Supabase Transfer / New Owner Guide

UNFILTERED LOG is intentionally not coupled to one Supabase account or project.

The frontend reads only two browser-safe environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

The database schema and RLS policies live in `supabase/migrations/`.
OAuth client secrets are **never committed to Git**.

## Option A - Preferred: Transfer the existing Supabase project

Use this when UNFILTERED LOG is being handed to a new owner and you want to keep the existing database, auth users, project ref, and project configuration.

1. The recipient creates a Supabase account and target organization.
2. The recipient invites the current project owner into the target organization.
3. The current owner accepts the invitation.
4. Resolve any Supabase transfer blockers first (for example an active GitHub integration, project-scoped roles, or log drains).
5. In the existing project, go to **Project Settings > General > Transfer Project** and select the recipient's organization.
6. After transfer, the recipient should take ownership of the Google and Discord OAuth applications and replace the provider client ID/secrets in Supabase Auth.
7. Update deployment ownership (Vercel/DNS/GitHub) separately.
8. Rotate any private credentials that belonged to the prior owner.

Because the project itself moves organizations, the app does not need a database migration for this handoff.

## Option B - Brand-new Supabase project

Use this when the recipient wants a totally fresh Supabase project.

### 1. Create the project

Create a new Supabase project in the recipient's organization.

### 2. Install the Supabase CLI if needed

```bash
npm install -D supabase
```

### 3. Link the repository to the recipient's project

```bash
npx supabase login
npx supabase link --project-ref RECIPIENT_PROJECT_REF
```

### 4. Create the UNFILTERED LOG schema

```bash
npx supabase db push
```

That applies the committed migration in `supabase/migrations/` and creates:

- `profiles`
- `posts`
- Row Level Security policies
- OAuth profile synchronization trigger
- required indexes

### 5. Configure the frontend

Copy:

```text
.env.example
```

to:

```text
.env.local
```

Then fill in:

```text
VITE_SUPABASE_URL=https://RECIPIENT_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Never put a Supabase secret key or legacy service-role key into a Vite variable. Vite browser variables are public by design.

### 6. Configure auth URLs

In **Supabase > Authentication > URL Configuration**:

- Site URL: production UNFILTERED LOG URL
- Redirect URLs: add localhost/staging/production URLs used by UNFILTERED LOG

Recommended development entry:

```text
http://localhost:5173/**
```

### 7. Configure Google OAuth

Create a Google OAuth application owned by the recipient and configure the Supabase callback URL shown in the Google provider settings.

The callback follows this shape:

```text
https://RECIPIENT_PROJECT_REF.supabase.co/auth/v1/callback
```

Enable Google under **Authentication > Sign In / Providers** and paste the recipient-owned Client ID and Client Secret.

### 8. Configure Discord OAuth

Create a Discord application owned by the recipient.

Add this redirect URI in the Discord Developer Portal:

```text
https://RECIPIENT_PROJECT_REF.supabase.co/auth/v1/callback
```

Enable Discord under **Authentication > Sign In / Providers** and paste the recipient-owned Client ID and Client Secret.

### 9. Install frontend dependency

```bash
npm install @supabase/supabase-js
```

### 10. Start UNFILTERED LOG

```bash
npm run dev
```

## What never needs source-code editing during a handoff

Do **not** hard-code any of these in `AppV2.tsx`:

- Supabase project URL
- Supabase publishable key
- Google client secret
- Discord client secret
- project ref
- production domain

Changing Supabase projects should be configuration + migration work, not an application rewrite.

## Security boundary

The browser uses only a Supabase publishable key. The migration enables RLS so authenticated users can create/update/delete only their own posts. Any future secret/server key belongs only in server-side infrastructure and should never be committed or exposed to Vite.
