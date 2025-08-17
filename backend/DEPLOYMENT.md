# Ugo AI - Production Deployment Guide

## 🤖 Overview

This guide provides instructions for deploying the Ugo AI emotional-canine assistant in a production environment using Docker Compose.

## 📋 Prerequisites

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **System Requirements**:
  - CPU: Intel i7-1255U or equivalent (minimum 4 cores)
  - RAM: 24GB minimum (16GB for model + 8GB for services)
  - Disk: 50GB available space (model files + containers)
  - OS: Linux (Ubuntu 20.04+ recommended)

## 🚀 Quick Deployment

### 1. Clone and Setup
```bash
cd /path/to/project/backend
./scripts/deploy.sh
```

### 2. Manual Deployment Steps

#### Step 1: Environment Setup
```bash
# Copy and configure environment file
cp .env.production.example .env.production

# Edit configuration
nano .env.production
```

#### Step 2: Model Setup
```bash
# Download AI model (4GB+ download)
./scripts/setup-model.sh
```

#### Step 3: Service Deployment
```bash
# Build and start all services
docker-compose up -d --build

# Check service status
docker-compose ps
```

## 🔧 Configuration

### Environment Variables (.env.production)

```bash
# Core Application
NODE_ENV=production
PORT=3000
API_HOST=0.0.0.0

# AI Model Configuration
MODEL_PATH=/app/models/mistral-7b-instruct-v0.1.q4_K_M.gguf
MODEL_THREADS=8
MODEL_CONTEXT_SIZE=4096
MODEL_GPU_LAYERS=0

# Database Configuration  
DATABASE_URL=postgresql://ugo_user:secure_password@postgres:5432/ugo_ai_db

# Redis Configuration
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=your_redis_password

# Security
JWT_SECRET=your_super_secure_jwt_secret_change_this
ENCRYPTION_KEY=your_32_character_encryption_key

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
LOG_FILE=/app/logs/app.log
```

### Service Architecture

```mermaid
graph TB
    A[Client] --> B[Nginx Reverse Proxy]
    B --> C[Ugo API Service]
    C --> D[Model Service]
    C --> E[PostgreSQL]
    C --> F[Redis Cache]
    G[Prometheus] --> C
    G --> E
    G --> F
    H[Grafana] --> G
```

## 📊 Services Overview

### Core Services
- **ugo-api**: Main Node.js API server (Port 3000)
- **model-service**: llama.cpp inference server (Port 8080)
- **postgres**: PostgreSQL database (Port 5432)
- **redis**: Redis cache (Port 6379)
- **nginx**: Reverse proxy and load balancer (Port 80)

### Monitoring Services
- **prometheus**: Metrics collection (Port 9090)
- **grafana**: Metrics visualization (Port 3001)

## 🔍 Health Monitoring

### Health Check Endpoints

```bash
# Overall system health
curl http://localhost/health

# API service health
curl http://localhost/api/health

# Model service health  
curl http://localhost/model/health

# Individual service checks
docker-compose ps
docker-compose logs -f ugo-api
```

### Service URLs

- **Main API**: `http://localhost/api/`
- **Ugo Chat**: `http://localhost/api/ugo/chat`
- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3001` (admin/admin)
- **Health Check**: `http://localhost/health`

## 🛠 Troubleshooting

### Common Issues

#### 1. Model Service Not Starting
```bash
# Check model file
ls -la models/mistral-7b-instruct-v0.1.q4_K_M.gguf

# Check model service logs
docker-compose logs model-service

# Re-download model if corrupted
./scripts/setup-model.sh
```

#### 2. High Memory Usage
```bash
# Monitor resource usage
docker stats

# Restart services if needed
docker-compose restart

# Check system resources
free -h
df -h
```

#### 3. Database Connection Issues
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Test database connection
docker-compose exec postgres psql -U ugo_user -d ugo_ai_db
```

#### 4. API Response Slow
```bash
# Check API logs
docker-compose logs -f ugo-api

# Monitor Prometheus metrics
curl http://localhost:9090/metrics

# Check Redis connection
docker-compose exec redis redis-cli ping
```

### Log Locations
- Application logs: `./logs/`
- Docker logs: `docker-compose logs [service]`
- Nginx logs: Inside nginx container at `/var/log/nginx/`

## 🔒 Security Considerations

### Production Security Checklist
- [ ] Change all default passwords
- [ ] Use strong JWT secrets
- [ ] Configure proper firewall rules
- [ ] Enable SSL/TLS (add reverse proxy with certificates)
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Backup database regularly

### Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS (if SSL configured)
sudo ufw enable
```

## 📈 Performance Optimization

### CPU Optimization
```bash
# Model threads configuration
MODEL_THREADS=8  # Adjust based on CPU cores

# Container resource limits
docker-compose.yml:
  deploy:
    resources:
      limits:
        cpus: '6'
        memory: 16G
```

### Memory Optimization  
```bash
# Reduce model context size if needed
MODEL_CONTEXT_SIZE=2048

# Configure swap if necessary
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 🔄 Maintenance

### Regular Maintenance Tasks

#### Daily
```bash
# Check service status
docker-compose ps

# Monitor resource usage
docker stats --no-stream

# Check logs for errors
docker-compose logs --since 24h | grep ERROR
```

#### Weekly
```bash
# Clean up Docker resources
docker system prune -f

# Backup database
./scripts/backup.sh

# Update system packages
sudo apt update && sudo apt upgrade -y
```

#### Monthly
```bash
# Full system backup
tar -czf ugo-ai-backup-$(date +%Y%m%d).tar.gz .

# Review and rotate logs
find ./logs -name "*.log" -mtime +30 -delete

# Security updates
docker-compose pull
docker-compose up -d
```

## 🆘 Emergency Procedures

### Service Recovery
```bash
# Quick restart all services
docker-compose down && docker-compose up -d

# Reset to clean state
docker-compose down -v
docker system prune -a -f
./scripts/deploy.sh
```

### Backup and Restore
```bash
# Create backup
./scripts/backup.sh

# Restore from backup
./scripts/restore.sh backup-file.sql
```

## 📞 Support

For issues and support:
1. Check service logs: `docker-compose logs [service]`
2. Review this troubleshooting guide
3. Check GitHub issues
4. Contact system administrator

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [PostgreSQL Administration](https://www.postgresql.org/docs/)
- [Prometheus Monitoring](https://prometheus.io/docs/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/)
