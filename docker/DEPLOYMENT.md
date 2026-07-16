# House OS - Production Deployment Guide

## Prerequisites

- Ubuntu server with Docker and Docker Compose v2
- Portainer (optional but recommended)
- Existing containers running: `cretek-postgres`, `ollama`

---

## 1. Initial Server Setup (One-Time)

### Connect existing containers to the shared network

Your existing `cretek-postgres` and `ollama` containers need to be on the `houseos` Docker network so our containers can reach them by name.

```bash
# SSH into your server
ssh root@129.151.177.10

# Create the shared network (if it doesn't exist)
docker network create houseos

# Connect existing containers to the network
docker network connect houseos cretek-postgres
docker network connect houseos ollama
```

### Verify connectivity

```bash
# Check all containers are on the network
docker network inspect houseos

# Test that the API container can reach postgres
docker run --rm --network houseos postgres:15 pg_isready -h cretek-postgres -p 5432 -U houseos_user

# Test that the API container can reach ollama
docker run --rm --network houseos curlimages/curl curl -s http://ollama:11434/api/tags
```

---

## 2. Clone and Configure

```bash
# Clone the repository
cd /opt
git clone <your-repo-url> house-os
cd house-os

# Create the .env file
cp docker/.env.example docker/.env

# Edit with your values
nano docker/.env
```

**Minimum required values in `.env`:**

```
DB_PASSWORD=your_actual_postgres_password
JWT_SECRET=run_this_command_to_generate: openssl rand -base64 32
APP_URL=http://129.151.177.10:3000
API_URL=http://129.151.177.10:4000
CORS_ORIGIN=http://129.151.177.10:3000
NEXT_PUBLIC_API_URL=http://129.151.177.10:4000/api/v1
```

---

## 3. Build and Deploy

```bash
cd /opt/house-os/docker

# Build images
docker compose build

# Start services
docker compose up -d

# Check status
docker compose ps

# Watch logs
docker compose logs -f
```

---

## 4. Portainer Deployment

### Method A: Upload Stack Files (Recommended)

1. Open Portainer at `https://129.151.177.10:9443`
2. Go to **Stacks** > **Add Stack**
3. Choose **Upload** as the build method
4. Upload these files:
   - `docker/docker-compose.yml` (rename to `docker-compose.yml`)
   - `docker/.env`
5. Set the **Environment files** to `.env`
6. Click **Deploy the stack**

### Method B: Git Repository

1. Go to **Stacks** > **Add Stack**
2. Choose **Git repository**
3. Enter your repo URL
4. Set the compose file path: `docker/docker-compose.yml`
5. Add environment variables in the **Env** tab or attach the `.env` file
6. Click **Deploy**

### After Portainer Deployment — Connect Existing Containers

In Portainer, go to **Networks** > click `houseos` > **Connect** and connect:
- `cretek-postgres`
- `ollama`

---

## 5. Post-Deployment Verification

```bash
# Check all services are running
docker compose -f docker/docker-compose.yml ps

# Check API health
curl http://localhost:4000/api/v1/health

# Check web app
curl -I http://localhost:3000

# Check API logs
docker compose -f docker/docker-compose.yml logs api

# Check web logs
docker compose -f docker/docker-compose.yml logs web
```

**Expected output:**

```
# API Health
{"status":"healthy","timestamp":"...","database":"connected"}

# Web
HTTP/1.1 200 OK
```

---

## 6. Common Operations

```bash
# View logs (follow)
docker compose -f docker/docker-compose.yml logs -f

# View only API logs
docker compose -f docker/docker-compose.yml logs -f api

# Restart a service
docker compose -f docker/docker-compose.yml restart api

# Rebuild after code changes
docker compose -f docker/docker-compose.yml build api
docker compose -f docker/docker-compose.yml up -d api

# Rebuild everything
docker compose -f docker/docker-compose.yml build
docker compose -f docker/docker-compose.yml up -d

# Stop all services
docker compose -f docker/docker-compose.yml down

# Stop and remove volumes (DANGEROUS — deletes data)
docker compose -f docker/docker-compose.yml down -v
```

---

## 7. Updating the Application

```bash
# Pull latest code
cd /opt/house-os
git pull origin main

# Rebuild and restart
cd docker
docker compose build
docker compose up -d

# Or just rebuild one service
docker compose build api
docker compose up -d api
```

---

## 8. Backup

### Database Backup

```bash
# Backup the database
docker exec cretek-postgres pg_dump -U houseos_user houseos > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20240101.sql | docker exec -i cretek-postgres psql -U houseos_user -d houseos
```

### Full Backup

```bash
# Backup everything (containers, volumes, configs)
docker exec cretek-postgres pg_dump -U houseos_user houseos > /backups/houseos_$(date +%Y%m%d).sql
cp -r /opt/house-os /backups/house-os_$(date +%Y%m%d)
```

---

## 9. SSL / Domain Setup (Future)

When ready to use Nginx Proxy Manager:

1. Deploy Nginx Proxy Manager container
2. Add proxy host for `api.yourdomain.com` → `houseos-api:4000`
3. Add proxy host for `yourdomain.com` → `houseos-web:3000`
4. Update `.env`:
   ```
   APP_URL=https://yourdomain.com
   API_URL=https://api.yourdomain.com
   CORS_ORIGIN=https://yourdomain.com
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
   ```
5. Rebuild and restart:
   ```bash
   docker compose build
   docker compose up -d
   ```

---

## 10. Troubleshooting

### API can't connect to database

```bash
# Check if postgres is reachable
docker run --rm --network houseos postgres:15 pg_isready -h cretek-postgres -p 5432 -U houseos_user

# Check API logs for connection errors
docker compose logs api | grep -i "error\|database\|connect"
```

### API can't connect to Ollama

```bash
# Check if ollama is reachable
docker run --rm --network houseos curlimages/curl curl http://ollama:11434/api/tags

# Check Ollama is running
docker ps | grep ollama
```

### Web app shows "localhost" errors

Make sure `NEXT_PUBLIC_API_URL` is set correctly in `.env`:
```
NEXT_PUBLIC_API_URL=http://129.151.177.10:4000/api/v1
```
Then rebuild:
```bash
docker compose build web
docker compose up -d web
```

### Prisma migration errors

The API container runs `prisma db push` on startup. If it fails:
```bash
# Manually run migrations
docker exec houseos-api npx prisma db push --skip-generate

# Or regenerate Prisma client
docker exec houseos-api npx prisma generate
```

### Port conflicts

If ports 3000 or 4000 are in use, change them in `.env`:
```
API_PORT=4001
WEB_PORT=3001
```

### Windows build fails with `output: 'standalone'`

This is expected. The `output: 'standalone'` setting is automatically injected by the Dockerfile during the Docker build. The local `next.config.ts` intentionally does NOT include it so that Windows development builds work.

### Build errors in Docker

The API is bundled with **tsup** (single file, ~98KB). Workspace packages (`@house-os/config`, `@house-os/database`) are inlined into the bundle. If you see module resolution errors:

```bash
# Rebuild from scratch
docker compose build --no-cache api
docker compose up -d api
```

---

## Architecture

```
Internet
    │
    ├── :3000 → houseos-web (Next.js)
    │              │
    │              └──→ API calls → houseos-api (:4000)
    │                                    │
    │                                    ├──→ cretek-postgres (:5432)
    │                                    └──→ ollama (:11434)
    │
    └── :4000 → houseos-api (Express)
                   │
                   ├──→ cretek-postgres (:5432)
                   └──→ ollama (:11434)

All connected via Docker bridge network: houseos
```
