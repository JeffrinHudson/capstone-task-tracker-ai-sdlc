# syntax=docker/dockerfile:1
# Build context must be the repo root (shared package-lock.json lives there).

# ---- build stage ----
FROM node:20-slim AS builder
WORKDIR /app

# Copy all workspace manifests so npm resolves hoisted deps correctly
COPY package.json package-lock.json ./
COPY backend/package.json  ./backend/
COPY frontend/package.json ./frontend/
COPY e2e/package.json      ./e2e/
RUN npm ci

# Generate the Prisma client for the current platform
COPY backend/prisma ./backend/prisma
RUN cd backend && npx prisma generate

# Compile TypeScript
COPY backend/tsconfig.json ./backend/
COPY backend/src           ./backend/src
RUN npm run build --workspace=backend

# ---- runtime stage ----
FROM node:20-slim AS runner
WORKDIR /app

# Bring in the full hoisted node_modules (includes prisma CLI for migrate deploy)
COPY --from=builder /app/node_modules    ./node_modules
COPY --from=builder /app/backend/dist    ./backend/dist
COPY backend/prisma                      ./backend/prisma

VOLUME /data
EXPOSE 3000
ENV NODE_ENV=production

# Run migrations then start the server
WORKDIR /app/backend
CMD ["sh", "-c", "node /app/node_modules/.bin/prisma migrate deploy && node dist/index.js"]
