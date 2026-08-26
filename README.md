# Capstone Task Tracker — AI SDLC

A monorepo containing the backend API, frontend UI, and end-to-end tests.

## Structure

```
capstone-task-tracker-ai-sdlc/
├── backend/    # Express + TypeScript + Prisma + SQLite
├── frontend/   # React + Vite + TypeScript
└── e2e/        # Playwright end-to-end tests
```

## Prerequisites

- Node 20+ (`nvm use` if using nvm)
- npm 10+

## Setup

```bash
# Install all workspace dependencies
npm install

# Install Playwright browsers (first time only)
npx playwright install --prefix e2e

# Copy and configure backend environment
cp backend/.env.example backend/.env
```

## Running

```bash
# Start backend dev server (port 3001)
npm run dev:backend

# Start frontend dev server (port 5173)
npm run dev:frontend
```

## Database

```bash
# Run database migrations
npm run db:migrate --workspace=backend

# Regenerate Prisma client after schema changes
npm run db:generate --workspace=backend
```

## Lint & Format

```bash
# Lint all workspaces
npm run lint

# Format all files in place
npm run format

# Check formatting without writing
npm run format:check
```

## Tests

```bash
# Run e2e tests (requires frontend + backend running)
npm run test:e2e
```

## Build

```bash
# Build all workspaces
npm run build
```
