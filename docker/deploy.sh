#!/bin/bash
# ============================================================
# House OS — Production Deployment
# Run this on the server (129.151.177.10) via SSH
# ============================================================
set -e

echo "=== House OS Deployment ==="
echo ""

# ---- CONFIGURATION ----
REPO_URL="https://github.com/YOUR_USERNAME/houseos.git"  # <-- EDIT THIS
DB_PASSWORD="YOUR_DB_PASSWORD"                             # <-- EDIT THIS
DEPLOY_DIR="/opt/houseos"
SERVER_IP="129.151.177.10"

# ---- 1. Clone or update repo ----
if [ -d "$DEPLOY_DIR/.git" ]; then
  echo "Updating repository..."
  cd "$DEPLOY_DIR"
  git pull origin main
else
  echo "Cloning repository..."
  sudo mkdir -p "$DEPLOY_DIR"
  sudo chown "$(whoami)" "$DEPLOY_DIR"
  git clone "$REPO_URL" "$DEPLOY_DIR"
  cd "$DEPLOY_DIR"
fi

# ---- 2. Create Docker network ----
echo ""
echo "Setting up Docker network..."
docker network create houseos 2>/dev/null || echo "houseos network already exists"

# Connect existing containers to houseos network
for CONTAINER in cretek-postgres ollama; do
  if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    if ! docker network inspect houseos --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null | grep -q "$CONTAINER"; then
      echo "Connecting $CONTAINER to houseos network..."
      docker network connect houseos "$CONTAINER"
    else
      echo "$CONTAINER already on houseos network"
    fi
  else
    echo "WARNING: $CONTAINER not running — skipping"
  fi
done

# ---- 3. Generate JWT secret ----
JWT_SECRET=$(openssl rand -base64 32)
echo ""
echo "Generated JWT_SECRET: $JWT_SECRET"

# ---- 4. Create .env file ----
ENV_FILE="$DEPLOY_DIR/docker/.env"

if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<EOF
# House OS Production Environment
# Generated $(date -u +"%Y-%m-%dT%H:%M:%SZ")

DB_PASSWORD=$DB_PASSWORD

JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

APP_URL=http://${SERVER_IP}:3000
API_URL=http://${SERVER_IP}:4000
CORS_ORIGIN=http://${SERVER_IP}:3000
NEXT_PUBLIC_API_URL=http://${SERVER_IP}:4000/api/v1

API_PORT=4000
WEB_PORT=3000

AI_PROVIDER=ollama
OLLAMA_MODEL=llama3

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@houseos.app
COOKIE_SECURE=false
EOF
  echo "Created $ENV_FILE"
else
  echo "$ENV_FILE already exists — skipping"
fi

# ---- 5. Build and deploy ----
echo ""
echo "Building Docker images (this may take several minutes)..."
cd "$DEPLOY_DIR/docker"
docker compose build --no-cache

echo ""
echo "Starting services..."
docker compose up -d

# ---- 6. Wait for health ----
echo ""
echo "Waiting for API to become healthy..."
for i in $(seq 1 90); do
  if curl -sf http://localhost:4000/api/v1/health >/dev/null 2>&1; then
    echo "API is healthy!"
    break
  fi
  [ $i -eq 90 ] && echo "WARNING: API not responding after 90s — check logs"
  sleep 1
done

# ---- 7. Status ----
echo ""
echo "Container status:"
docker compose ps

echo ""
echo "============================================"
echo "  DEPLOYMENT COMPLETE"
echo "============================================"
echo ""
echo "  Web:  http://${SERVER_IP}:3000"
echo "  API:  http://${SERVER_IP}:4000"
echo "  Health: http://${SERVER_IP}:4000/api/v1/health"
echo ""
echo "  Logs:"
echo "    docker compose -f $DEPLOY_DIR/docker/docker-compose.yml logs -f api"
echo "    docker compose -f $DEPLOY_DIR/docker/docker-compose.yml logs -f web"
echo ""
