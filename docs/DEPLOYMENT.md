# NexusFlow AI — Production Deployment Guide

## 1. Prerequisites
- Node.js 20+ LTS or Docker 24+
- Supabase project (Cloud or Self-Hosted)
- Google AI Studio project with Gemini API Key

---

## 2. Docker & Container Deployment

### 2.1 Backend Dockerfile (`backend/Dockerfile`)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### 2.2 Frontend Dockerfile (`frontend/Dockerfile`)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig*.json vite.config.ts tailwind.config.ts postcss.config.js index.html ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2.3 Running via Docker Compose
```bash
# Ensure .env is populated
docker-compose up --build -d
```

---

## 3. Supabase Cloud Configuration

1. In Supabase Dashboard, create a new project.
2. Open the **SQL Editor**.
3. Sequentially execute the migration scripts:
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_rls_policies.sql`
   - `supabase/migrations/0003_database_functions.sql`
   - `supabase/migrations/0004_indexes_and_constraints.sql`
   - `supabase/migrations/0005_storage_policies.sql`
4. (Optional) Run `supabase/seed.sql` to populate sample enterprise data.
5. In **Storage**, verify the bucket `enterprise-documents` is created as **private**.

---

## 4. Google Gemini Configuration

1. Visit [Google AI Studio](https://aistudio.google.com/) and create an API key.
2. In your production environment, set:
   ```env
   GEMINI_API_KEY=AIzaSy...
   GEMINI_MODEL=gemini-2.5-flash
   ```
3. The official `@google/genai` SDK automatically connects securely on the backend.
