#!/bin/bash

# Ugo AI Production Deployment Script
# This script orchestrates the complete deployment of Ugo AI services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🤖 Ugo AI Production Deployment"
echo "==============================="
echo "📁 Project directory: $PROJECT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check Docker
if ! command -v docker >/dev/null 2>&1; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Choose compose command: prefer 'docker compose' if available, otherwise 'docker-compose'
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 2>/dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    # Fallback (should not reach due to earlier check)
    DOCKER_COMPOSE_CMD="docker-compose"
fi
print_status "Using compose command: $DOCKER_COMPOSE_CMD"

print_success "Prerequisites check passed"

# Navigate to project directory
cd "$PROJECT_DIR"

# Check required files
print_status "Checking required configuration files..."
required_files=(
    "docker-compose.yml"
    ".env.production"
    "Dockerfile"
    "docker/nginx/nginx.conf"
    "docker/prometheus/prometheus.yml"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file not found: $file"
        exit 1
    fi
    print_success "Found: $file"
done

# Setup model
print_status "Setting up AI model..."
if [ -f "scripts/setup-model.sh" ]; then
    if ./scripts/setup-model.sh; then
        print_success "Model setup completed"
    else
        print_error "Model setup failed"
        exit 1
    fi
else
    print_warning "Model setup script not found, skipping..."
fi

# Load environment variables safely
if [ -f ".env.production" ]; then
    print_status "Loading production environment..."
    # Export only valid KEY=VALUE lines. Avoid exporting filenames or arbitrary tokens.
    # Use a temporary filtered file to prevent 'export' errors on non-identifiers.
    TMP_ENV_FILE=$(mktemp /tmp/ugo_env.XXXXXX)
    # Keep only lines like KEY=VALUE, ignore comments and blank lines
    # Quote values safely so lines with spaces do not get executed when sourced
    while IFS= read -r line; do
        # Skip comments and blank lines
        [[ -z "$line" || "$line" =~ ^# ]] && continue
        if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
            key="${BASH_REMATCH[1]}"
            val="${BASH_REMATCH[2]}"
            # Trim possible leading/trailing whitespace from val
            val="$(echo "$val" | sed -e 's/^ *//' -e 's/ *$//')"
            # Escape single quotes in the value
            val_escaped="${val//\'/\'"\'"\'}"
            printf "%s='%s'\n" "$key" "$val_escaped" >> "$TMP_ENV_FILE"
        fi
    done < .env.production
    # Export variables from the filtered, quoted file
    set -a
    # shellcheck disable=SC1090
    source "$TMP_ENV_FILE"
    set +a
    rm -f "$TMP_ENV_FILE"
    print_success "Environment loaded"
else
    print_warning ".env.production not found; continuing with current environment"
fi

# Build and start services
print_status "Building and starting Ugo AI services..."

# Stop any existing services
print_status "Stopping existing services..."
$DOCKER_COMPOSE_CMD down --remove-orphans || true

# Build services
print_status "Building Docker images..."
if $DOCKER_COMPOSE_CMD build --no-cache; then
    print_success "Docker images built successfully"
else
    print_error "Docker build failed"
    exit 1
fi

# Start services
print_status "Starting services..."
if $DOCKER_COMPOSE_CMD up -d; then
    print_success "Services started successfully"
else
    print_error "Failed to start services"
    exit 1
fi

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Health checks
print_status "Performing health checks..."

# Check if nginx is responding
if curl -f http://localhost/health >/dev/null 2>&1; then
    print_success "Nginx is responding"
else
    print_warning "Nginx health check failed"
fi

# Check if API is responding
if curl -f http://localhost/api/health >/dev/null 2>&1; then
    print_success "API service is responding"
else
    print_warning "API health check failed"
fi

# Show running services
print_status "Current service status:"
$DOCKER_COMPOSE_CMD ps

# Show logs for any failed services
failed_services=$($DOCKER_COMPOSE_CMD ps --services --filter "status=exited")
if [ -n "$failed_services" ]; then
    print_warning "Some services failed to start. Showing logs:"
    for service in $failed_services; do
        print_warning "Logs for $service:"
        $DOCKER_COMPOSE_CMD logs --tail=20 "$service"
    done
fi

echo ""
print_success "🎉 Ugo AI deployment completed!"
echo ""
echo "📋 Service URLs:"
echo "   🌐 Main API: http://localhost/api/"
echo "   🤖 Ugo Chat: http://localhost/api/ugo/chat"
echo "   📊 Prometheus: http://localhost:9090"
echo "   📈 Grafana: http://localhost:3001"
echo "   🔍 Health Check: http://localhost/health"
echo ""
echo "📝 Useful commands:"
echo "   View logs: $DOCKER_COMPOSE_CMD logs -f"
echo "   Stop services: $DOCKER_COMPOSE_CMD down"
echo "   Restart: $DOCKER_COMPOSE_CMD restart"
echo "   Monitor: $DOCKER_COMPOSE_CMD ps"
echo ""
print_status "Deployment script completed"
