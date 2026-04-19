# Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Настроить monorepo skeleton — pnpm workspaces, 6 сервисов с health endpoint, shared packages, docker-compose для инфраструктуры.

**Architecture:** pnpm workspaces монорепо. Каждый сервис — изолированный пакет со своим package.json. Два shared пакета (@findnmeet/types, @findnmeet/utils) подключаются через `workspace:*`. api-gateway и auth-service на NestJS, остальные три JS-сервиса на Express, vk-gateway на Go.

**Tech Stack:** Node.js 20, pnpm 9, TypeScript 5.7, NestJS 11, Express 4, Go 1.21, Docker Compose, Jest, supertest

---

## File Map

```
/                             ← монорепо root
  package.json                ← обновить (убрать NestJS deps, добавить workspace scripts)
  tsconfig.json               ← обновить (base config для всех сервисов)
  pnpm-workspace.yaml         ← создать
  .npmrc                      ← создать (настройки pnpm для NestJS)
  .gitignore                  ← обновить
  .env.example                ← создать
  docker-compose.yml          ← создать (postgres + redis)

/packages/types/
  package.json
  tsconfig.json
  src/index.ts                ← ServiceHealthResponse

/packages/utils/
  package.json
  tsconfig.json
  src/index.ts                ← buildHealthResponse()

/services/api-gateway/        ← NestJS, port 3000
  package.json
  nest-cli.json
  tsconfig.json
  tsconfig.build.json
  src/main.ts
  src/app.module.ts
  src/health/health.controller.ts
  src/health/health.controller.spec.ts

/services/auth-service/       ← NestJS, port 3001
  package.json
  nest-cli.json
  tsconfig.json
  tsconfig.build.json
  src/main.ts
  src/app.module.ts
  src/health/health.controller.ts
  src/health/health.controller.spec.ts

/services/search-orchestrator/ ← Express, port 3002
  package.json
  tsconfig.json
  src/app.ts
  src/app.spec.ts
  src/index.ts

/services/favorites-service/   ← Express, port 3003
  package.json
  tsconfig.json
  src/app.ts
  src/app.spec.ts
  src/index.ts

/services/ai-service/          ← Express, port 3004
  package.json
  tsconfig.json
  src/app.ts
  src/app.spec.ts
  src/index.ts

/services/vk-gateway/          ← Go, port 8080
  go.mod
  cmd/server/main.go
  cmd/server/main_test.go
```

---

## Task 1: Очистить boilerplate и настроить корень монорепо

**Files:**
- Delete: `src/`, `test/`, `nest-cli.json`, `tsconfig.build.json`, `eslint.config.mjs`, `README.md`
- Modify: `package.json`, `tsconfig.json`
- Create: `pnpm-workspace.yaml`, `.npmrc`, `.gitignore`

- [ ] **Step 1: Удалить старые файлы**

```bash
cd /path/to/findNmeet-back
rm -rf src test nest-cli.json tsconfig.build.json eslint.config.mjs README.md
rm -rf node_modules pnpm-lock.yaml
```

- [ ] **Step 2: Обновить корневой `package.json`**

Заменить содержимое полностью:

```json
{
  "name": "findnmeet",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev:gateway": "pnpm --filter api-gateway dev",
    "dev:auth": "pnpm --filter auth-service dev",
    "dev:search": "pnpm --filter search-orchestrator dev",
    "dev:favorites": "pnpm --filter favorites-service dev",
    "dev:ai": "pnpm --filter ai-service dev",
    "infra:up": "docker compose up -d",
    "infra:down": "docker compose down"
  }
}
```

- [ ] **Step 3: Обновить корневой `tsconfig.json`**

Заменить содержимое полностью:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

- [ ] **Step 4: Создать `pnpm-workspace.yaml`**

```yaml
packages:
  - 'services/*'
  - 'packages/*'
```

- [ ] **Step 5: Создать `.npmrc`**

```ini
public-hoist-pattern[]=*
```

Это нужно чтобы pnpm корректно разрешал peer dependencies NestJS.

- [ ] **Step 6: Обновить `.gitignore`**

```gitignore
node_modules
dist
.env
*.log
coverage
.DS_Store

# Go
services/vk-gateway/bin/
```

- [ ] **Step 7: Создать структуру директорий**

```bash
mkdir -p packages/types/src
mkdir -p packages/utils/src
mkdir -p services/api-gateway/src/health
mkdir -p services/auth-service/src/health
mkdir -p services/search-orchestrator/src
mkdir -p services/favorites-service/src
mkdir -p services/ai-service/src
mkdir -p services/vk-gateway/cmd/server
```

---

## Task 2: Создать shared пакет `@findnmeet/types`

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`

- [ ] **Step 1: Создать `packages/types/package.json`**

```json
{
  "name": "@findnmeet/types",
  "version": "0.0.1",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
```

- [ ] **Step 2: Создать `packages/types/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Создать `packages/types/src/index.ts`**

```typescript
export interface ServiceHealthResponse {
  status: 'ok';
  service: string;
}
```

---

## Task 3: Создать shared пакет `@findnmeet/utils`

**Files:**
- Create: `packages/utils/package.json`
- Create: `packages/utils/tsconfig.json`
- Create: `packages/utils/src/index.ts`

- [ ] **Step 1: Создать `packages/utils/package.json`**

```json
{
  "name": "@findnmeet/utils",
  "version": "0.0.1",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "@findnmeet/types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
```

- [ ] **Step 2: Создать `packages/utils/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "paths": {
      "@findnmeet/types": ["../types/src"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Создать `packages/utils/src/index.ts`**

```typescript
import { ServiceHealthResponse } from '@findnmeet/types';

export function buildHealthResponse(service: string): ServiceHealthResponse {
  return { status: 'ok', service };
}
```

---

## Task 4: Scaffold api-gateway (NestJS, порт 3000)

**Files:**
- Create: `services/api-gateway/package.json`
- Create: `services/api-gateway/nest-cli.json`
- Create: `services/api-gateway/tsconfig.json`
- Create: `services/api-gateway/tsconfig.build.json`
- Create: `services/api-gateway/src/health/health.controller.spec.ts` (тест первым)
- Create: `services/api-gateway/src/health/health.controller.ts`
- Create: `services/api-gateway/src/app.module.ts`
- Create: `services/api-gateway/src/main.ts`

- [ ] **Step 1: Создать `services/api-gateway/package.json`**

```json
{
  "name": "api-gateway",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "start:prod": "node dist/main",
    "test": "jest",
    "test:cov": "jest --coverage"
  },
  "dependencies": {
    "@findnmeet/types": "workspace:*",
    "@findnmeet/utils": "workspace:*",
    "@nestjs/common": "^11.0.1",
    "@nestjs/core": "^11.0.1",
    "@nestjs/platform-express": "^11.0.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.1",
    "@types/express": "^5.0.0",
    "@types/jest": "^30.0.0",
    "@types/node": "^24.0.0",
    "@types/supertest": "^7.0.0",
    "jest": "^30.0.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.7.3"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 2: Создать `services/api-gateway/nest-cli.json`**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

- [ ] **Step 3: Создать `services/api-gateway/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "paths": {
      "@findnmeet/types": ["../../packages/types/src"],
      "@findnmeet/utils": ["../../packages/utils/src"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

- [ ] **Step 4: Создать `services/api-gateway/tsconfig.build.json`**

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

- [ ] **Step 5: Написать падающий тест `services/api-gateway/src/health/health.controller.spec.ts`**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('GET /health', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('возвращает { status: ok, service: api-gateway }', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', service: 'api-gateway' });
  });
});
```

- [ ] **Step 6: Запустить тест — убедиться что падает**

```bash
pnpm --filter api-gateway test
```

Ожидаемый результат: `Cannot find module '../app.module'` или аналогичная ошибка — значит тест работает и падает по правильной причине.

- [ ] **Step 7: Создать `services/api-gateway/src/health/health.controller.ts`**

```typescript
import { Controller, Get } from '@nestjs/common';
import { buildHealthResponse } from '@findnmeet/utils';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return buildHealthResponse('api-gateway');
  }
}
```

- [ ] **Step 8: Создать `services/api-gateway/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';

@Module({
  controllers: [HealthController],
})
export class AppModule {}
```

- [ ] **Step 9: Создать `services/api-gateway/src/main.ts`**

```typescript
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.API_GATEWAY_PORT ?? 3000;
  await app.listen(port);
  console.log(`api-gateway running on port ${port}`);
}

bootstrap();
```

- [ ] **Step 10: Запустить тест — убедиться что проходит**

```bash
pnpm --filter api-gateway test
```

Ожидаемый результат:
```
PASS src/health/health.controller.spec.ts
  GET /health
    ✓ возвращает { status: ok, service: api-gateway }
```

- [ ] **Step 11: Commit**

```bash
git add services/api-gateway packages/types packages/utils pnpm-workspace.yaml .npmrc tsconfig.json package.json .gitignore
git commit -m "feat: scaffold api-gateway and shared packages"
```

---

## Task 5: Scaffold auth-service (NestJS, порт 3001)

**Files:**
- Create: `services/auth-service/package.json`
- Create: `services/auth-service/nest-cli.json`
- Create: `services/auth-service/tsconfig.json`
- Create: `services/auth-service/tsconfig.build.json`
- Create: `services/auth-service/src/health/health.controller.spec.ts`
- Create: `services/auth-service/src/health/health.controller.ts`
- Create: `services/auth-service/src/app.module.ts`
- Create: `services/auth-service/src/main.ts`

- [ ] **Step 1: Создать `services/auth-service/package.json`**

```json
{
  "name": "auth-service",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "start:prod": "node dist/main",
    "test": "jest",
    "test:cov": "jest --coverage"
  },
  "dependencies": {
    "@findnmeet/types": "workspace:*",
    "@findnmeet/utils": "workspace:*",
    "@nestjs/common": "^11.0.1",
    "@nestjs/core": "^11.0.1",
    "@nestjs/platform-express": "^11.0.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.1",
    "@types/express": "^5.0.0",
    "@types/jest": "^30.0.0",
    "@types/node": "^24.0.0",
    "@types/supertest": "^7.0.0",
    "jest": "^30.0.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.7.3"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 2: Создать `services/auth-service/nest-cli.json`**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

- [ ] **Step 3: Создать `services/auth-service/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "paths": {
      "@findnmeet/types": ["../../packages/types/src"],
      "@findnmeet/utils": ["../../packages/utils/src"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

- [ ] **Step 4: Создать `services/auth-service/tsconfig.build.json`**

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

- [ ] **Step 5: Написать падающий тест `services/auth-service/src/health/health.controller.spec.ts`**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('GET /health', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('возвращает { status: ok, service: auth-service }', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', service: 'auth-service' });
  });
});
```

- [ ] **Step 6: Запустить тест — убедиться что падает**

```bash
pnpm --filter auth-service test
```

Ожидаемый результат: `Cannot find module '../app.module'`

- [ ] **Step 7: Создать `services/auth-service/src/health/health.controller.ts`**

```typescript
import { Controller, Get } from '@nestjs/common';
import { buildHealthResponse } from '@findnmeet/utils';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return buildHealthResponse('auth-service');
  }
}
```

- [ ] **Step 8: Создать `services/auth-service/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';

@Module({
  controllers: [HealthController],
})
export class AppModule {}
```

- [ ] **Step 9: Создать `services/auth-service/src/main.ts`**

```typescript
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.AUTH_SERVICE_PORT ?? 3001;
  await app.listen(port);
  console.log(`auth-service running on port ${port}`);
}

bootstrap();
```

- [ ] **Step 10: Запустить тест — убедиться что проходит**

```bash
pnpm --filter auth-service test
```

Ожидаемый результат:
```
PASS src/health/health.controller.spec.ts
  GET /health
    ✓ возвращает { status: ok, service: auth-service }
```

- [ ] **Step 11: Commit**

```bash
git add services/auth-service
git commit -m "feat: scaffold auth-service"
```

---

## Task 6: Scaffold Express-сервисы (search-orchestrator, favorites-service, ai-service)

**Files (повторяются для каждого сервиса, разница только в имени и порту):**
- Create: `services/<name>/package.json`
- Create: `services/<name>/tsconfig.json`
- Create: `services/<name>/src/app.spec.ts`
- Create: `services/<name>/src/app.ts`
- Create: `services/<name>/src/index.ts`

### 6a: search-orchestrator (порт 3002)

- [ ] **Step 1: Создать `services/search-orchestrator/package.json`**

```json
{
  "name": "search-orchestrator",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start:prod": "node dist/index.js",
    "test": "jest"
  },
  "dependencies": {
    "@findnmeet/types": "workspace:*",
    "@findnmeet/utils": "workspace:*",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/jest": "^30.0.0",
    "@types/node": "^24.0.0",
    "@types/supertest": "^7.0.0",
    "jest": "^30.0.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.7.3"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 2: Создать `services/search-orchestrator/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "paths": {
      "@findnmeet/types": ["../../packages/types/src"],
      "@findnmeet/utils": ["../../packages/utils/src"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Написать падающий тест `services/search-orchestrator/src/app.spec.ts`**

```typescript
import request from 'supertest';
import { app } from './app';

describe('GET /health', () => {
  it('возвращает { status: ok, service: search-orchestrator }', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'search-orchestrator' });
  });
});
```

- [ ] **Step 4: Запустить тест — убедиться что падает**

```bash
pnpm --filter search-orchestrator test
```

Ожидаемый результат: `Cannot find module './app'`

- [ ] **Step 5: Создать `services/search-orchestrator/src/app.ts`**

```typescript
import express from 'express';
import { buildHealthResponse } from '@findnmeet/utils';

export const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json(buildHealthResponse('search-orchestrator'));
});
```

- [ ] **Step 6: Создать `services/search-orchestrator/src/index.ts`**

```typescript
import { app } from './app';

const port = process.env.SEARCH_ORCHESTRATOR_PORT ?? 3002;
app.listen(port, () => {
  console.log(`search-orchestrator running on port ${port}`);
});
```

- [ ] **Step 7: Запустить тест — убедиться что проходит**

```bash
pnpm --filter search-orchestrator test
```

Ожидаемый результат:
```
PASS src/app.spec.ts
  GET /health
    ✓ возвращает { status: ok, service: search-orchestrator }
```

### 6b: favorites-service (порт 3003)

- [ ] **Step 8: Создать `services/favorites-service/package.json`**

```json
{
  "name": "favorites-service",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start:prod": "node dist/index.js",
    "test": "jest"
  },
  "dependencies": {
    "@findnmeet/types": "workspace:*",
    "@findnmeet/utils": "workspace:*",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/jest": "^30.0.0",
    "@types/node": "^24.0.0",
    "@types/supertest": "^7.0.0",
    "jest": "^30.0.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.7.3"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 9: Создать `services/favorites-service/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "paths": {
      "@findnmeet/types": ["../../packages/types/src"],
      "@findnmeet/utils": ["../../packages/utils/src"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 10: Написать падающий тест `services/favorites-service/src/app.spec.ts`**

```typescript
import request from 'supertest';
import { app } from './app';

describe('GET /health', () => {
  it('возвращает { status: ok, service: favorites-service }', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'favorites-service' });
  });
});
```

- [ ] **Step 11: Создать `services/favorites-service/src/app.ts`**

```typescript
import express from 'express';
import { buildHealthResponse } from '@findnmeet/utils';

export const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json(buildHealthResponse('favorites-service'));
});
```

- [ ] **Step 12: Создать `services/favorites-service/src/index.ts`**

```typescript
import { app } from './app';

const port = process.env.FAVORITES_SERVICE_PORT ?? 3003;
app.listen(port, () => {
  console.log(`favorites-service running on port ${port}`);
});
```

- [ ] **Step 13: Запустить тест**

```bash
pnpm --filter favorites-service test
```

Ожидаемый результат:
```
PASS src/app.spec.ts
  GET /health
    ✓ возвращает { status: ok, service: favorites-service }
```

### 6c: ai-service (порт 3004)

- [ ] **Step 14: Создать `services/ai-service/package.json`**

```json
{
  "name": "ai-service",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start:prod": "node dist/index.js",
    "test": "jest"
  },
  "dependencies": {
    "@findnmeet/types": "workspace:*",
    "@findnmeet/utils": "workspace:*",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/jest": "^30.0.0",
    "@types/node": "^24.0.0",
    "@types/supertest": "^7.0.0",
    "jest": "^30.0.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.7.3"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 15: Создать `services/ai-service/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "paths": {
      "@findnmeet/types": ["../../packages/types/src"],
      "@findnmeet/utils": ["../../packages/utils/src"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 16: Написать падающий тест `services/ai-service/src/app.spec.ts`**

```typescript
import request from 'supertest';
import { app } from './app';

describe('GET /health', () => {
  it('возвращает { status: ok, service: ai-service }', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'ai-service' });
  });
});
```

- [ ] **Step 17: Создать `services/ai-service/src/app.ts`**

```typescript
import express from 'express';
import { buildHealthResponse } from '@findnmeet/utils';

export const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json(buildHealthResponse('ai-service'));
});
```

- [ ] **Step 18: Создать `services/ai-service/src/index.ts`**

```typescript
import { app } from './app';

const port = process.env.AI_SERVICE_PORT ?? 3004;
app.listen(port, () => {
  console.log(`ai-service running on port ${port}`);
});
```

- [ ] **Step 19: Запустить тест**

```bash
pnpm --filter ai-service test
```

Ожидаемый результат:
```
PASS src/app.spec.ts
  GET /health
    ✓ возвращает { status: ok, service: ai-service }
```

- [ ] **Step 20: Commit**

```bash
git add services/search-orchestrator services/favorites-service services/ai-service
git commit -m "feat: scaffold express services (search-orchestrator, favorites, ai)"
```

---

## Task 7: Scaffold vk-gateway (Go, порт 8080)

**Files:**
- Create: `services/vk-gateway/go.mod`
- Create: `services/vk-gateway/cmd/server/main_test.go` (тест первым)
- Create: `services/vk-gateway/cmd/server/main.go`

Предварительно: убедись что Go установлен — `go version` должна вернуть `go1.21` или выше.

- [ ] **Step 1: Создать `services/vk-gateway/go.mod`**

```
module github.com/findnmeet/vk-gateway

go 1.21
```

- [ ] **Step 2: Написать падающий тест `services/vk-gateway/cmd/server/main_test.go`**

```go
package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthHandler(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()

	healthHandler(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}

	var resp HealthResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Status != "ok" {
		t.Errorf("expected status 'ok', got '%s'", resp.Status)
	}
	if resp.Service != "vk-gateway" {
		t.Errorf("expected service 'vk-gateway', got '%s'", resp.Service)
	}
}
```

- [ ] **Step 3: Запустить тест — убедиться что падает**

```bash
cd services/vk-gateway
go test ./cmd/server/...
```

Ожидаемый результат: `undefined: healthHandler` или `undefined: HealthResponse`

- [ ] **Step 4: Создать `services/vk-gateway/cmd/server/main.go`**

```go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
)

type HealthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
}

func healthHandler(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(HealthResponse{Status: "ok", Service: "vk-gateway"})
}

func main() {
	port := os.Getenv("VK_GATEWAY_PORT")
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", healthHandler)

	fmt.Printf("vk-gateway running on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
```

- [ ] **Step 5: Запустить тест — убедиться что проходит**

```bash
cd services/vk-gateway
go test ./cmd/server/... -v
```

Ожидаемый результат:
```
=== RUN   TestHealthHandler
--- PASS: TestHealthHandler (0.00s)
PASS
```

- [ ] **Step 6: Commit**

```bash
git add services/vk-gateway
git commit -m "feat: scaffold vk-gateway (Go)"
```

---

## Task 8: Инфраструктура и .env.example

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`

- [ ] **Step 1: Создать `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: findnmeet
      POSTGRES_PASSWORD: findnmeet
      POSTGRES_DB: findnmeet
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

volumes:
  postgres_data:
  redis_data:
```

- [ ] **Step 2: Создать `.env.example`**

```env
# Infrastructure
POSTGRES_URL=postgresql://findnmeet:findnmeet@localhost:5432/findnmeet
REDIS_URL=redis://localhost:6379

# VK OAuth
VK_APP_ID=
VK_APP_SECRET=
VK_REDIRECT_URI=http://localhost:3000/auth/vk/callback

# OpenAI
OPENAI_API_KEY=

# JWT (межсервисная авторизация — RSA ключевая пара)
JWT_PRIVATE_KEY=
JWT_PUBLIC_KEY=

# JWT пользовательские токены
USER_JWT_SECRET=
USER_JWT_EXPIRES_IN=15m
USER_REFRESH_EXPIRES_IN=30d

# Шифрование VK токенов в БД
TOKEN_ENCRYPTION_KEY=

# Порты (опциональны — везде есть дефолты)
API_GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
SEARCH_ORCHESTRATOR_PORT=3002
FAVORITES_SERVICE_PORT=3003
AI_SERVICE_PORT=3004
VK_GATEWAY_PORT=8080
```

- [ ] **Step 3: Запустить инфраструктуру**

```bash
docker compose up -d
```

Ожидаемый результат:
```
[+] Running 2/2
 ✔ Container findnmeet-back-postgres-1  Started
 ✔ Container findnmeet-back-redis-1     Started
```

- [ ] **Step 4: Проверить подключение к postgres**

```bash
docker compose exec postgres psql -U findnmeet -c '\l'
```

Ожидаемый результат: список баз данных включающий `findnmeet`.

- [ ] **Step 5: Проверить подключение к redis**

```bash
docker compose exec redis redis-cli ping
```

Ожидаемый результат: `PONG`

- [ ] **Step 6: Commit**

```bash
git add docker-compose.yml .env.example
git commit -m "feat: add infrastructure docker-compose and env example"
```

---

## Task 9: Финальная установка и проверка

- [ ] **Step 1: Создать `.env` из примера**

```bash
cp .env.example .env
```

- [ ] **Step 2: Установить все зависимости**

```bash
pnpm install
```

Ожидаемый результат: все пакеты установлены, создан `pnpm-lock.yaml`, в каждом сервисе появился `node_modules`.

- [ ] **Step 3: Запустить все тесты**

```bash
pnpm --filter './services/*' test
pnpm --filter './packages/*' test 2>/dev/null || true
```

Ожидаемый результат: все 5 JS/TS сервисов — тесты проходят.

- [ ] **Step 4: Запустить тесты Go**

```bash
cd services/vk-gateway && go test ./cmd/server/... -v
```

Ожидаемый результат: `PASS`

- [ ] **Step 5: Проверить что каждый сервис стартует**

В отдельных терминалах (или по одному):

```bash
# Terminal 1
pnpm --filter api-gateway dev
# Ожидаемый результат: api-gateway running on port 3000

# Terminal 2
pnpm --filter auth-service dev
# Ожидаемый результат: auth-service running on port 3001

# Terminal 3
pnpm --filter search-orchestrator dev
# Ожидаемый результат: search-orchestrator running on port 3002
```

Проверить health endpoints:

```bash
curl http://localhost:3000/health
# {"status":"ok","service":"api-gateway"}

curl http://localhost:3001/health
# {"status":"ok","service":"auth-service"}

curl http://localhost:3002/health
# {"status":"ok","service":"search-orchestrator"}
```

- [ ] **Step 6: Финальный commit**

```bash
git add .
git commit -m "feat: complete monorepo foundation — all services scaffold with health endpoints"
```

---

## Self-Review

**Spec coverage:**
- [x] pnpm workspaces — Task 1
- [x] 6 сервисов с правильными портами — Tasks 4–7
- [x] Shared packages (@findnmeet/types, @findnmeet/utils) — Tasks 2–3
- [x] docker-compose.yml (postgres + redis) — Task 8
- [x] .env.example — Task 8
- [x] pnpm-workspace.yaml — Task 1
- [x] Команды разработки работают — Task 9

**Что не входит в этот план (следующие планы):**
- VK OAuth логика (Plan 2: auth-service)
- Межсервисный JWT middleware (Plan 3: api-gateway)
- Реальная бизнес-логика всех сервисов
- docker-compose.prod.yml с Dockerfile для каждого сервиса
