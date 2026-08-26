# syntax=docker/dockerfile:1
# Build context must be the repo root.

# ---- build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# VITE_API_URL is intentionally left empty in Docker:
# nginx proxies /api/ to the backend container, so the browser
# makes same-origin requests and no explicit origin is needed.
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json  ./backend/
COPY e2e/package.json      ./e2e/
RUN npm ci

COPY frontend ./frontend
RUN npm run build --workspace=frontend

# ---- runtime stage ----
FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
