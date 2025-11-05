# Deployment Guide

This guide covers deployment strategies for Access-Unlocked across different environments and platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Options](#deployment-options)
- [Production Deployment](#production-deployment)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Scaling Strategy](#scaling-strategy)
- [Security Checklist](#security-checklist)

## Prerequisites

### Required Services

1. **Compute**
   - Application servers (container-based)
   - Background workers

2. **Database**
   - PostgreSQL 14+ with PostGIS
   - Redis for caching

3. **Storage**
   - Object storage (S3-compatible)
   - Backup storage

4. **Networking**
   - Load balancer
   - CDN
   - DNS

### API Keys

Ensure you have obtained all required API keys:
- OpenStreetMap (optional for self-hosted)
- Wheelmap API
- Google Places API
- Mapbox API
- (Optional) Other regional accessibility APIs

See [API_INTEGRATION.md](../API_INTEGRATION.md) for details.

## Environment Setup

### Environment Variables

Create environment-specific configuration files:

**Production (.env.production)**
```env
# Application
NODE_ENV=production
PORT=3000
APP_URL=https://access-unlocked.org
API_URL=https://api.access-unlocked.org

# Database
DATABASE_URL=postgresql://user:password@db-host:5432/access_unlocked
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_SSL=true

# Redis
REDIS_URL=redis://:password@redis-host:6379
REDIS_TLS=true

# Object Storage (S3-compatible)
S3_BUCKET=access-unlocked-production
S3_REGION=us-east-1
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_ENDPOINT=https://s3.amazonaws.com

# CDN
CDN_URL=https://cdn.access-unlocked.org

# API Keys
OPENSTREETMAP_API_KEY=your_key
WHEELMAP_API_KEY=your_key
GOOGLE_PLACES_API_KEY=your_key
MAPBOX_ACCESS_TOKEN=your_token

# Authentication
JWT_SECRET=your_very_long_random_secret_min_32_chars
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=another_very_long_random_secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Email (SendGrid example)
EMAIL_FROM=noreply@access-unlocked.org
SENDGRID_API_KEY=your_sendgrid_key

# Monitoring
SENTRY_DSN=your_sentry_dsn
NEW_RELIC_LICENSE_KEY=your_new_relic_key

# Rate Limiting
RATE_LIMIT_ANONYMOUS=100
RATE_LIMIT_AUTHENTICATED=1000
RATE_LIMIT_WINDOW=3600

# Feature Flags
ENABLE_USER_CONTRIBUTIONS=true
ENABLE_ROUTE_PLANNING=true
MAINTENANCE_MODE=false
```

## Deployment Options

### Option 1: Docker + Kubernetes

Recommended for scalability and cloud-native deployments.

#### Dockerfile

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

#### docker-compose.yml (Development)

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/access_unlocked
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./src:/app/src

  db:
    image: postgis/postgis:14-3.3
    environment:
      - POSTGRES_DB=access_unlocked
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  elasticsearch:
    image: elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elastic_data:/usr/share/elasticsearch/data

volumes:
  postgres_data:
  redis_data:
  elastic_data:
```

#### Kubernetes Deployment

**deployment.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: access-unlocked-api
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: access-unlocked-api
  template:
    metadata:
      labels:
        app: access-unlocked-api
    spec:
      containers:
      - name: api
        image: access-unlocked/api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: access-unlocked-api
  namespace: production
spec:
  selector:
    app: access-unlocked-api
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: access-unlocked-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.access-unlocked.org
    secretName: api-tls
  rules:
  - host: api.access-unlocked.org
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: access-unlocked-api
            port:
              number: 80
```

### Option 2: AWS Deployment

#### Architecture

```
Route 53 (DNS)
    │
    ▼
CloudFront (CDN)
    │
    ▼
Application Load Balancer
    │
    ├─── ECS Fargate (API)
    │    ├── Task 1
    │    ├── Task 2
    │    └── Task N (Auto-scaling)
    │
    ├─── RDS PostgreSQL (Multi-AZ)
    │    ├── Primary
    │    └── Read Replica
    │
    ├─── ElastiCache Redis (Cluster)
    │
    ├─── Amazon Elasticsearch
    │
    └─── S3 (Static Assets, Photos, Backups)
```

#### Terraform Configuration

**main.tf**
```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "access-unlocked-vpc"
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier        = "access-unlocked-db"
  engine            = "postgres"
  engine_version    = "14.7"
  instance_class    = "db.t3.medium"
  allocated_storage = 100
  storage_encrypted = true

  db_name  = "access_unlocked"
  username = var.db_username
  password = var.db_password

  multi_az               = true
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  skip_final_snapshot = false
  final_snapshot_identifier = "access-unlocked-final-snapshot"

  tags = {
    Name = "access-unlocked-db"
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "access-unlocked-cache"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = "cache.t3.medium"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379

  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]

  tags = {
    Name = "access-unlocked-cache"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "access-unlocked-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "api" {
  family                   = "access-unlocked-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "api"
      image = "${aws_ecr_repository.api.repository_url}:latest"
      
      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        }
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = aws_secretsmanager_secret.db_url.arn
        },
        {
          name      = "REDIS_URL"
          valueFrom = aws_secretsmanager_secret.redis_url.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/access-unlocked-api"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "access-unlocked-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = true

  tags = {
    Name = "access-unlocked-alb"
  }
}
```

### Option 3: Heroku Deployment

Simple deployment for small-scale applications.

**Procfile**
```
web: node dist/server.js
worker: node dist/worker.js
```

**app.json**
```json
{
  "name": "access-unlocked",
  "description": "Accessibility travel companion",
  "stack": "heroku-22",
  "buildpacks": [
    {
      "url": "heroku/nodejs"
    }
  ],
  "addons": [
    {
      "plan": "heroku-postgresql:standard-0",
      "options": {
        "version": "14"
      }
    },
    {
      "plan": "heroku-redis:premium-0"
    }
  ],
  "env": {
    "NODE_ENV": {
      "value": "production"
    },
    "JWT_SECRET": {
      "generator": "secret"
    }
  }
}
```

**Deploy Commands**
```bash
# Login to Heroku
heroku login

# Create app
heroku create access-unlocked-api

# Add buildpacks
heroku buildpacks:set heroku/nodejs

# Add PostgreSQL with PostGIS
heroku addons:create heroku-postgresql:standard-0

# Enable PostGIS
heroku pg:psql -c "CREATE EXTENSION postgis;"

# Add Redis
heroku addons:create heroku-redis:premium-0

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set GOOGLE_PLACES_API_KEY=your_key

# Deploy
git push heroku main

# Scale dynos
heroku ps:scale web=2 worker=1

# View logs
heroku logs --tail
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations tested
- [ ] API keys validated
- [ ] SSL certificates configured
- [ ] Backup strategy in place
- [ ] Monitoring tools configured
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Documentation updated
- [ ] Rollback plan prepared

### Database Migration

```bash
# Run migrations
npm run db:migrate

# Or with Docker
docker-compose exec app npm run db:migrate

# Rollback if needed
npm run db:migrate:undo
```

### Deployment Steps

#### 1. Build Application

```bash
# Install dependencies
npm ci --only=production

# Build
npm run build

# Run tests
npm test
```

#### 2. Database Setup

```bash
# Create database
createdb access_unlocked

# Enable PostGIS extension
psql -d access_unlocked -c "CREATE EXTENSION postgis;"
psql -d access_unlocked -c "CREATE EXTENSION uuid-ossp;"
psql -d access_unlocked -c "CREATE EXTENSION pg_trgm;"

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

#### 3. Deploy Application

**Using Docker:**
```bash
# Build image
docker build -t access-unlocked/api:latest .

# Tag for registry
docker tag access-unlocked/api:latest registry.example.com/access-unlocked/api:latest

# Push to registry
docker push registry.example.com/access-unlocked/api:latest

# Deploy to Kubernetes
kubectl apply -f k8s/
```

**Using CI/CD (GitHub Actions):**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
    
    - name: Build Docker image
      run: docker build -t access-unlocked/api:${{ github.sha }} .
    
    - name: Push to ECR
      env:
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      run: |
        aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY
        docker tag access-unlocked/api:${{ github.sha }} $ECR_REGISTRY/access-unlocked/api:latest
        docker push $ECR_REGISTRY/access-unlocked/api:latest
    
    - name: Deploy to ECS
      run: |
        aws ecs update-service --cluster access-unlocked-cluster --service api --force-new-deployment
```

## Monitoring and Maintenance

### Health Checks

**Health Check Endpoint:**
```javascript
// /health endpoint
app.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      elasticsearch: await checkElasticsearch()
    }
  };
  
  const isHealthy = Object.values(health.checks).every(check => check.status === 'OK');
  
  res.status(isHealthy ? 200 : 503).json(health);
});
```

### Logging

Configure structured logging:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'access-unlocked-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

### Monitoring Tools

1. **Application Performance Monitoring**
   - New Relic
   - DataDog
   - Application Insights

2. **Error Tracking**
   - Sentry
   - Rollbar

3. **Infrastructure Monitoring**
   - Prometheus + Grafana
   - CloudWatch (AWS)

4. **Uptime Monitoring**
   - UptimeRobot
   - Pingdom

## Scaling Strategy

### Horizontal Scaling

```yaml
# Kubernetes HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: access-unlocked-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: access-unlocked-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Database Scaling

1. **Read Replicas**: For read-heavy workloads
2. **Connection Pooling**: Use PgBouncer
3. **Partitioning**: Partition facilities table by geographic region
4. **Caching**: Redis for frequently accessed data

## Security Checklist

- [ ] HTTPS/TLS enabled
- [ ] API keys stored securely (not in code)
- [ ] Database connections encrypted
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Security headers configured
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning
- [ ] WAF (Web Application Firewall) configured
- [ ] DDoS protection enabled
- [ ] Backup encryption enabled

## Rollback Plan

```bash
# Kubernetes rollback
kubectl rollout undo deployment/access-unlocked-api

# Or rollback to specific revision
kubectl rollout undo deployment/access-unlocked-api --to-revision=2

# Check rollout status
kubectl rollout status deployment/access-unlocked-api

# View rollout history
kubectl rollout history deployment/access-unlocked-api
```

## Support

For deployment issues:
- Check logs: `kubectl logs -f deployment/access-unlocked-api`
- Review health checks: `curl https://api.access-unlocked.org/health`
- Contact: devops@access-unlocked.org
