# Sprint 1 Setup Guide

**Sprint:** 1 (Weeks 1-2)
**Goal:** Project Setup & Database Foundation
**Duration:** 2 weeks

This guide will walk you through setting up the Access-Unlocked project from scratch.

---

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js:** v18 or higher ([Download](https://nodejs.org/))
- **Docker:** Latest version ([Download](https://www.docker.com/))
- **Git:** Latest version ([Download](https://git-scm.com/))
- **Code Editor:** VS Code recommended ([Download](https://code.visualstudio.com/))

### VS Code Extensions (Recommended)
- ESLint
- Prettier
- Docker
- Prisma
- GitLens
- Thunder Client (for API testing)

---

## Week 1: Project Initialization

### Day 1: Initialize Node.js Project

#### Step 1: Create Project Structure

```bash
# Navigate to project root
cd access-Unlocked

# Create source directory structure
mkdir -p src/{config,models,services,controllers,routes,middleware,utils,types,tests}

# Create other important directories
mkdir -p docs scripts .github/workflows
```

#### Step 2: Initialize npm and TypeScript

```bash
# Initialize npm project
npm init -y

# Install TypeScript and essential dependencies
npm install --save-dev typescript @types/node ts-node nodemon

# Initialize TypeScript configuration
npx tsc --init
```

#### Step 3: Configure TypeScript

Create or update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

#### Step 4: Install Fastify and Core Dependencies

```bash
# Install Fastify and core dependencies
npm install fastify @fastify/cors @fastify/helmet @fastify/compress @fastify/rate-limit

# Install TypeScript types
npm install --save-dev @types/node
```

#### Step 5: Set up ESLint and Prettier

```bash
# Install ESLint and Prettier
npm install --save-dev eslint prettier eslint-config-prettier eslint-plugin-prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser

# Initialize ESLint
npx eslint --init
```

Create `.eslintrc.json`:

```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "plugins": ["@typescript-eslint", "prettier"],
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

Create `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

#### Step 6: Configure Git Hooks with Husky

```bash
# Install Husky and lint-staged
npm install --save-dev husky lint-staged

# Initialize Husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"
```

Create `.lintstagedrc.json`:

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

#### Step 7: Update package.json Scripts

Update `package.json` with useful scripts:

```json
{
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:seed": "ts-node prisma/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

---

### Day 2-3: Docker Setup

#### Step 1: Create Docker Compose Configuration

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL with PostGIS
  postgres:
    image: postgis/postgis:14-3.3
    container_name: access-unlocked-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: access_unlocked_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    container_name: access-unlocked-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # pgAdmin (optional, for database management)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: access-unlocked-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@access-unlocked.local
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres

volumes:
  postgres_data:
  redis_data:
```

#### Step 2: Create Database Initialization Script

Create `scripts/init-db.sql`:

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Verify extensions
SELECT PostGIS_version();
```

#### Step 3: Create .env File

Create `.env`:

```env
# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000
API_URL=http://localhost:3000/api

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/access_unlocked_dev?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# JWT (generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-change-this
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-min-32-characters-change-this
REFRESH_TOKEN_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_ANONYMOUS=100
RATE_LIMIT_AUTHENTICATED=1000
RATE_LIMIT_WINDOW=3600

# Logging
LOG_LEVEL=debug

# Feature Flags
ENABLE_SWAGGER=true
```

Add `.env` to `.gitignore`:

```bash
echo ".env" >> .gitignore
```

#### Step 4: Start Docker Services

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Test PostgreSQL connection
docker exec -it access-unlocked-db psql -U postgres -d access_unlocked_dev -c "SELECT PostGIS_version();"

# Test Redis connection
docker exec -it access-unlocked-redis redis-cli ping
```

---

### Day 4-5: Prisma Setup

#### Step 1: Install Prisma

```bash
# Install Prisma
npm install --save-dev prisma
npm install @prisma/client

# Initialize Prisma
npx prisma init
```

#### Step 2: Configure Prisma Schema

Update `prisma/schema.prisma`:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis, uuid_ossp(map: "uuid-ossp"), pg_trgm]
}

model User {
  id        String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  email     String   @unique @db.VarChar(255)
  password  String   @db.VarChar(255)
  name      String?  @db.VarChar(255)
  avatarUrl String?  @map("avatar_url") @db.Text

  contributionCount   Int     @default(0) @map("contribution_count")
  reputationPoints    Int     @default(0) @map("reputation_points")
  verifiedContributor Boolean @default(false) @map("verified_contributor")

  preferences Json @default("{}") @db.JsonB

  emailVerified           Boolean   @default(false) @map("email_verified")
  emailVerificationToken  String?   @map("email_verification_token") @db.VarChar(255)
  passwordResetToken      String?   @map("password_reset_token") @db.VarChar(255)
  passwordResetExpires    DateTime? @map("password_reset_expires")

  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  lastLogin DateTime? @map("last_login")
  deletedAt DateTime? @map("deleted_at")

  @@map("users")
}

model FacilityType {
  id          String   @id @db.VarChar(50)
  name        String   @db.VarChar(100)
  description String?  @db.Text
  icon        String?  @db.VarChar(50)
  category    String?  @db.VarChar(50)
  sortOrder   Int      @default(0) @map("sort_order")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("facility_types")
}

model Facility {
  id              String  @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  name            String  @db.VarChar(255)
  description     String? @db.Text
  facilityTypeId  String  @map("facility_type_id") @db.VarChar(50)

  // Location fields
  // Note: PostGIS geography type requires raw SQL for now
  lat     Decimal @db.Decimal(10, 8)
  lng     Decimal @db.Decimal(11, 8)
  address String? @db.Text

  // Accessibility features (boolean flags for quick filtering)
  wheelchairAccessible  Boolean? @map("wheelchair_accessible")
  hasRamp               Boolean? @map("has_ramp")
  hasElevator           Boolean? @map("has_elevator")
  hasAccessibleToilet   Boolean? @map("has_accessible_toilet")
  hasAccessibleParking  Boolean? @map("has_accessible_parking")
  hasAutomaticDoor      Boolean? @map("has_automatic_door")
  hasBrailleSignage     Boolean? @map("has_braille_signage")
  hasHearingLoop        Boolean? @map("has_hearing_loop")

  openingHours Json? @map("opening_hours") @db.JsonB

  phone   String? @db.VarChar(50)
  email   String? @db.VarChar(255)
  website String? @db.Text

  verified         Boolean   @default(false)
  verifiedBy       String?   @map("verified_by") @db.Uuid
  verifiedAt       DateTime? @map("verified_at")
  dataQualityScore Decimal?  @map("data_quality_score") @db.Decimal(3, 2)

  rating      Decimal? @db.Decimal(3, 2)
  reviewCount Int      @default(0) @map("review_count")

  dataSources Json @default("[]") @map("data_sources") @db.JsonB
  externalIds Json @default("{}") @map("external_ids") @db.JsonB

  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  lastVerifiedAt DateTime? @map("last_verified_at")
  deletedAt      DateTime? @map("deleted_at")

  @@map("facilities")
}
```

#### Step 3: Create Initial Migration

```bash
# Create and apply migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

#### Step 4: Create Seed Script

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed facility types
  const facilityTypes = [
    {
      id: 'toilet',
      name: 'Accessible Toilet',
      description: 'Public toilets with accessibility features',
      icon: 'toilet',
      category: 'amenity',
      sortOrder: 1,
    },
    {
      id: 'parking',
      name: 'Accessible Parking',
      description: 'Designated accessible parking spaces',
      icon: 'parking',
      category: 'transport',
      sortOrder: 2,
    },
    {
      id: 'ramp',
      name: 'Wheelchair Ramp',
      description: 'Ramps for wheelchair access',
      icon: 'ramp',
      category: 'access',
      sortOrder: 3,
    },
    {
      id: 'elevator',
      name: 'Elevator',
      description: 'Elevators for multi-level access',
      icon: 'elevator',
      category: 'access',
      sortOrder: 4,
    },
    {
      id: 'entrance',
      name: 'Accessible Entrance',
      description: 'Step-free building entrances',
      icon: 'entrance',
      category: 'access',
      sortOrder: 5,
    },
    {
      id: 'station',
      name: 'Transit Station',
      description: 'Accessible public transit stations',
      icon: 'station',
      category: 'transport',
      sortOrder: 6,
    },
  ];

  for (const type of facilityTypes) {
    await prisma.facilityType.upsert({
      where: { id: type.id },
      update: type,
      create: type,
    });
  }

  console.log('✅ Database seeded successfully');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Update `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Run seed:

```bash
npm run db:seed
```

---

## Week 2: Basic API Setup

### Day 1-2: Create Basic Server

#### Step 1: Create Server Configuration

Create `src/config/index.ts`:

```typescript
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:3000/api',

  database: {
    url: process.env.DATABASE_URL || '',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || '',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  },

  rateLimit: {
    anonymous: parseInt(process.env.RATE_LIMIT_ANONYMOUS || '100', 10),
    authenticated: parseInt(process.env.RATE_LIMIT_AUTHENTICATED || '1000', 10),
    window: parseInt(process.env.RATE_LIMIT_WINDOW || '3600', 10),
  },

  log: {
    level: process.env.LOG_LEVEL || 'info',
  },

  features: {
    swagger: process.env.ENABLE_SWAGGER === 'true',
  },
};
```

#### Step 2: Create Basic Server

Create `src/server.ts`:

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import { config } from './config';

const server = Fastify({
  logger: {
    level: config.log.level,
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Register plugins
server.register(cors, {
  origin: true,
});

server.register(helmet);

server.register(compress);

// Health check routes
server.get('/health', async () => {
  return {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
});

server.get('/health/ready', async () => {
  // TODO: Add database and redis health checks
  return {
    status: 'OK',
    timestamp: new Date().toISOString(),
  };
});

// Start server
const start = async () => {
  try {
    await server.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`🚀 Server ready at http://localhost:${config.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
```

Install additional dependencies:

```bash
npm install dotenv
npm install --save-dev pino-pretty
```

#### Step 3: Test the Server

```bash
# Run the server
npm run dev

# In another terminal, test health endpoint
curl http://localhost:3000/health
```

You should see:
```json
{
  "status": "OK",
  "timestamp": "2025-11-05T10:00:00.000Z",
  "uptime": 5.123
}
```

---

### Day 3-4: Jest Testing Setup

#### Step 1: Install Jest

```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

#### Step 2: Configure Jest

Create `jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/server.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

#### Step 3: Create First Test

Create `src/__tests__/health.test.ts`:

```typescript
import { describe, it, expect } from '@jest/globals';

describe('Health Check', () => {
  it('should pass this basic test', () => {
    expect(true).toBe(true);
  });
});
```

Run tests:

```bash
npm test
```

---

### Day 5: Documentation and Review

#### Step 1: Update README

Create comprehensive README with:
- Project description
- Prerequisites
- Setup instructions
- Running the application
- Running tests
- Project structure

#### Step 2: Create Development Guide

Document:
- Code style guidelines
- Git workflow
- Testing practices
- PR process

#### Step 3: Sprint 1 Review

Checklist:
- [ ] Docker Compose runs all services
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without errors
- [ ] Prettier formats code correctly
- [ ] Prisma generates client successfully
- [ ] Database migrations run successfully
- [ ] Seed data populates correctly
- [ ] Server starts and responds to health checks
- [ ] Tests run and pass
- [ ] Documentation is complete

---

## Troubleshooting

### Docker Issues

**Problem:** Docker containers won't start
```bash
# Stop all containers
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Rebuild and start fresh
docker-compose up -d --build
```

### Database Connection Issues

**Problem:** Can't connect to PostgreSQL
```bash
# Check if PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Test connection
docker exec -it access-unlocked-db psql -U postgres -c "SELECT version();"
```

### Prisma Issues

**Problem:** Prisma Client out of sync
```bash
# Regenerate Prisma Client
npx prisma generate

# Reset database (WARNING: deletes data)
npx prisma migrate reset
```

---

## Next Steps

After completing Sprint 1:

1. ✅ Review Sprint 1 checklist
2. ⬜ Plan Sprint 2 (Authentication & Core API)
3. ⬜ Set up CI/CD pipeline
4. ⬜ Begin implementing authentication

---

## Resources

- [Fastify Documentation](https://www.fastify.io/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

---

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review error messages carefully
3. Search existing GitHub issues
4. Create a new issue with detailed information

**Happy coding! 🚀**
