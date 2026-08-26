# UNFILTERED LOG

React + TypeScript + Vite frontend for **UNFILTERED LOG**.

## Local setup

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set the Supabase values in `.env.local` before using authentication, posts, comments, moderation, or editorial features.

## Production build

```powershell
npm run build
```

The project includes the Vercel SPA rewrite in `vercel.json`.
