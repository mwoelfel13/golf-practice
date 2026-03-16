# Golf Practice

A full-stack app for tracking golf practice sessions. Built with TanStack Start, React, and Supabase.

## Features

### Wedge Practice
Set a yardage range, hit to 10 random targets, and log where each shot lands. Tracks average deviation and standard deviation across sessions with visual charts.

### Stack Putting
18 random putts from 5-30 feet with varied slope and break. Record makes/misses, diagnose what went wrong (speed, direction, misread), and track comeback putts. View make rate, directional bias, and speed bias analytics.

### Authentication
Google sign-in via Supabase Auth. All practice data is linked to your account.

## Tech Stack

- **Framework:** TanStack Start (React 19, Vite, file-based routing with SSR)
- **UI:** Material UI + Tailwind CSS
- **Database:** PostgreSQL via Supabase
- **Auth:** Supabase Auth (Google OAuth)

## Setup

### 1. Install dependencies

```sh
npm install
```

### 2. Configure environment

Create a `.env` file:

```
DATABASE_URL=your-supabase-postgres-url

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:3000
```

Get these values from your Supabase project dashboard under **Settings > API**.

### 3. Enable Google Auth in Supabase

1. Go to **Authentication > Providers > Google** in the Supabase dashboard
2. Enable the provider and enter your Google Client ID and Secret
3. Add the Supabase callback URL to your Google Cloud Console authorized redirect URIs

### 4. Run migrations

```sh
npx tsx --env-file=.env src/db/migrate.ts
```

### 5. Start dev server

```sh
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests |
| `npm run lint` | Lint code |
| `npm run check` | Auto-fix formatting and lint issues |
