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

## API Reference

Base URL: `http://localhost:3001` — all request/response bodies are JSON.

### Task schema

| Field         | Type                        | Notes            |
| ------------- | --------------------------- | ---------------- |
| `id`          | `string` (UUID)             | Auto-generated   |
| `title`       | `string`                    | Required         |
| `description` | `string \| null`            | Optional         |
| `status`      | `OPEN \| DONE`              | Default `OPEN`   |
| `priority`    | `LOW \| MEDIUM \| HIGH`     | Default `MEDIUM` |
| `dueDate`     | `string \| null` (ISO 8601) | Optional         |
| `createdAt`   | `string` (ISO 8601)         | Auto-generated   |
| `updatedAt`   | `string` (ISO 8601)         | Auto-updated     |

---

### `GET /api/tasks`

List tasks with optional filtering and sorting.

**Query parameters**

| Parameter | Type           | Default | Description                                                |
| --------- | -------------- | ------- | ---------------------------------------------------------- |
| `q`       | `string`       | —       | Case-insensitive search across `title` and `description`   |
| `status`  | `OPEN \| DONE` | —       | Filter by status                                           |
| `sortBy`  | `dueDate`      | —       | Sort field                                                 |
| `sortDir` | `asc \| desc`  | `asc`   | Sort direction; tasks without a `dueDate` always sort last |

**Response** `200 OK` — `Task[]`

```
GET /api/tasks?status=OPEN&sortBy=dueDate&sortDir=asc
GET /api/tasks?q=pipeline
```

---

### `POST /api/tasks`

Create a task.

**Request body**

| Field         | Required | Notes                                     |
| ------------- | -------- | ----------------------------------------- |
| `title`       | yes      | Non-empty string                          |
| `description` | no       | String or omit                            |
| `priority`    | no       | `LOW \| MEDIUM \| HIGH`; default `MEDIUM` |
| `dueDate`     | no       | ISO 8601 string or omit                   |

**Response** `201 Created` — `Task`

```json
{ "title": "Ship it", "priority": "HIGH", "dueDate": "2026-09-30T00:00:00.000Z" }
```

---

### `PUT /api/tasks/:id`

Full replace of a task. Omitted nullable fields (`description`, `dueDate`) are cleared to `null`.

**Request body** — same fields as `POST`, plus:

| Field    | Required | Notes                          |
| -------- | -------- | ------------------------------ |
| `status` | no       | `OPEN \| DONE`; default `OPEN` |

**Response** `200 OK` — updated `Task`  
**Response** `404 Not Found` — task does not exist

---

### `PATCH /api/tasks/:id/status`

Toggle task status only.

**Request body**

```json
{ "status": "DONE" }
```

**Response** `200 OK` — updated `Task`  
**Response** `400 Bad Request` — invalid status value  
**Response** `404 Not Found` — task does not exist

---

### `DELETE /api/tasks/:id`

Delete a task.

**Response** `204 No Content`  
**Response** `404 Not Found` — task does not exist

---

### Error format

All `4xx` and `5xx` responses return:

```json
{ "error": "<human-readable message>" }
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

### End-to-end (Playwright)

Gherkin specifications live in `e2e/features/`. Playwright implementations live in `e2e/tests/`.

```bash
# Build images, start services via Docker Compose, then run all e2e tests
npm run test:e2e
```

`docker compose up -d --wait` starts the backend (`:3000`) and frontend (`:5173`) and waits for the backend health-check before running tests.

If both services are already running you can skip the compose step:

```bash
npm run test --workspace=e2e
# or, from inside e2e/:
npx playwright test
```

To run a single spec file:

```bash
npx playwright test tests/create-task.spec.ts --project=chromium
```

#### HTML report

After a test run the HTML report is written to `e2e/test-results/html-report/`.

```bash
# Open the last report in a browser
npx playwright show-report e2e/test-results/html-report
```

#### Environment variables

| Variable   | Default                 | Purpose                                             |
| ---------- | ----------------------- | --------------------------------------------------- |
| `BASE_URL` | `http://localhost:5173` | Frontend URL hit by Playwright                      |
| `API_URL`  | `http://localhost:3000` | Backend URL used by test helpers for setup/teardown |

## Build

### Shell script (Linux / macOS / WSL / Git Bash)

`build.sh` performs a fully clean build suitable for CI: it installs exact
dependency versions from the lock file then builds both workspaces in order.

```bash
chmod +x build.sh   # first time only
./build.sh
```

Steps performed:

1. Verify Node 20+ is available
2. `npm ci` — install exact versions from `package-lock.json`
3. `npm run build --workspace=backend` — `prisma generate` then `tsc` → `backend/dist/`
4. `npm run build --workspace=frontend` — `tsc` type-check then Vite bundle → `frontend/dist/`
5. Print artifact sizes

### npm scripts (cross-platform)

```bash
# Install + build all workspaces in one command (CI-safe)
npm run build:ci

# Build all workspaces (assumes node_modules already installed)
npm run build

# Build a single workspace
npm run build --workspace=backend
npm run build --workspace=frontend
```

### Output artifacts

| Path             | Contents                                                  |
| ---------------- | --------------------------------------------------------- |
| `backend/dist/`  | Compiled Node.js server (`index.js` + supporting modules) |
| `frontend/dist/` | Static files ready to be served (HTML, JS chunks, assets) |

### Starting the built backend

```bash
# Requires DATABASE_URL in the environment
cd backend
DATABASE_URL="file:./dev.db" npx prisma migrate deploy
node dist/index.js
```

## Docker

Requires Docker Desktop (or Docker Engine + Compose plugin).

### Start

```bash
# Build images and start backend (port 3000) + frontend (port 5173) in the background
npm run docker:up
# or
docker compose up --build -d
```

Open **http://localhost:5173** in a browser.

The backend API is also directly accessible at **http://localhost:3000**.

> **How it works:** The frontend is served by nginx which proxies `/api/*` requests to the backend container internally — no CORS configuration required.

### Logs

```bash
npm run docker:logs
# or
docker compose logs -f
```

### Stop

```bash
# Stop containers; SQLite data volume is preserved
npm run docker:down
# or
docker compose down

# Stop containers AND delete the SQLite data volume
docker compose down -v
```

### SQLite persistence

The database file lives in a named Docker volume (`db-data`).  
It survives `docker compose down` / `up` cycles.  
Only `docker compose down -v` destroys it.
