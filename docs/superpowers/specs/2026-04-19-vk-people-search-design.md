# VK People Search Service — Design Doc

**Date:** 2026-04-19
**Status:** Approved

---

## Overview

Сервис поиска людей через VK API. Пользователь вводит свободный текст ("Анна, 28 лет, блондинка, живёт в Москве") — сервис парсит его через LLM, делает запрос к VK API, затем асинхронно фильтрует результаты по фото через vision-модель. Результаты возвращаются в трёх группах: точные совпадения, вероятные, остальные.

---

## Архитектура

Строгие микросервисы, монорепо на pnpm workspaces. Сервисы общаются только через HTTP, знают друг о друге только через сеть.

### Структура монорепо

```
/findNmeet-back
  /services
    /api-gateway          NestJS — единая точка входа, сессии, WebSocket (Socket.io)
    /auth-service         NestJS — VK OAuth, JWT токены пользователей
    /search-orchestrator  Express — оркестрация поиска, постановка задач в BullMQ
    /favorites-service    Express — CRUD избранного (PostgreSQL)
    /ai-service           Express — парсинг текста + BullMQ worker для vision
    /vk-gateway           Go — rate limit 5 req/s, retry с backoff, параллельные запросы
  /packages
    /types                TypeScript типы, общие для всех сервисов
    /utils                Утилиты (логгер, HTTP клиент, crypto для токенов)
  docker-compose.yml      PostgreSQL + Redis (только инфраструктура для локальной разработки)
  docker-compose.prod.yml Все сервисы + инфраструктура
  pnpm-workspace.yaml
  package.json
  .env.example
```

### Порты

| Сервис              | Порт |
|---------------------|------|
| api-gateway         | 3000 |
| auth-service        | 3001 |
| search-orchestrator | 3002 |
| favorites-service   | 3003 |
| ai-service          | 3004 |
| vk-gateway (Go)     | 8080 |

---

## Поток данных

### Синхронная часть (~3 сек)

```
Клиент
  → POST /search (api-gateway :3000)
  → auth-service :3001  [проверка JWT пользователя]
  → search-orchestrator :3002
      → ai-service :3004  [парсинг текста → VK-параметры + описание внешности]
      → vk-gateway :8080  [запрос к VK API → список профилей]
  ← возвращает профили клиенту (без vision-фильтрации)
  → кладёт задачу в BullMQ (Redis) с параметром vision_limit из user_settings.vision_limit
```

### Асинхронная часть (~10 сек)

```
ai-service worker
  ← забирает задачу из BullMQ
  → анализирует фото (GPT-4o vision, макс. N профилей — из параметра задачи)
  → проверяет кеш Redis перед каждым запросом (ключ: hash(vk_photo_url), TTL 7 дней)
  → публикует событие в Redis pub/sub
api-gateway
  ← подписан на Redis pub/sub
  → отправляет переранжированные результаты клиенту через Socket.io
```

### Избранное

```
Клиент → POST /favorites/:profileId (api-gateway)
       → favorites-service :3003 (CRUD в PostgreSQL)
```

---

## База данных

### PostgreSQL

**`users`** — идентификация, обновляются редко:
| Поле        | Тип           |
|-------------|---------------|
| id          | UUID PK       |
| vk_id       | BIGINT UNIQUE |
| created_at  | TIMESTAMPTZ   |
| last_active | TIMESTAMPTZ   |

**`user_settings`** — пользовательские настройки:
| Поле         | Тип              |
|--------------|------------------|
| user_id      | UUID PK FK → users |
| vision_limit | INTEGER (def 20) |

**`vk_tokens`** — обновляется при каждом refresh VK токена:
| Поле          | Тип         |
|---------------|-------------|
| id            | UUID PK     |
| user_id       | UUID FK → users |
| access_token  | TEXT (зашифрован) |
| refresh_token | TEXT (зашифрован) |
| expires_at    | TIMESTAMPTZ |
| updated_at    | TIMESTAMPTZ |

**`auth_tokens`** — refresh токены нашего сервиса:
| Поле       | Тип         |
|------------|-------------|
| id         | UUID PK     |
| user_id    | UUID FK → users |
| token_hash | TEXT        |
| expires_at | TIMESTAMPTZ |
| created_at | TIMESTAMPTZ |

**`favorites`** — избранные профили:
| Поле             | Тип         |
|------------------|-------------|
| user_id          | UUID FK → users |
| vk_profile_id    | BIGINT      |
| profile_snapshot | JSONB       |
| created_at       | TIMESTAMPTZ |

PK: `(user_id, vk_profile_id)`

### Redis

| Ключ                          | Назначение                        | TTL    |
|-------------------------------|-----------------------------------|--------|
| `search:{searchId}`           | Результаты поиска                 | 1 час  |
| `vision:{hash(vk_photo_url)}` | Результат vision-анализа фото     | 7 дней |
| BullMQ queues                 | Очередь задач на vision-анализ    | —      |

---

## Межсервисная авторизация

RSA ключевая пара: API Gateway подписывает JWT, все сервисы верифицируют по публичному ключу.

**Заголовок на внутренних запросах:**
```
X-Service-Token: <JWT>
```

**JWT payload:**
```json
{
  "iss": "api-gateway",
  "sub": "<user-id или 'internal'>",
  "iat": 1234567890,
  "exp": 1234567890
}
```

- `JWT_PRIVATE_KEY` — только у api-gateway
- `JWT_PUBLIC_KEY` — у всех сервисов

---

## Переменные окружения (`.env`)

```env
# Инфраструктура
POSTGRES_URL=postgresql://user:pass@localhost:5432/findnmeet
REDIS_URL=redis://localhost:6379

# VK OAuth
VK_APP_ID=
VK_APP_SECRET=
VK_REDIRECT_URI=

# OpenAI
OPENAI_API_KEY=

# JWT (межсервисная авторизация)
JWT_PRIVATE_KEY=
JWT_PUBLIC_KEY=

# JWT пользовательские токены
USER_JWT_SECRET=
USER_JWT_EXPIRES_IN=15m
USER_REFRESH_EXPIRES_IN=30d

# Шифрование VK токенов в БД
TOKEN_ENCRYPTION_KEY=

# Порты (опционально, есть дефолты)
API_GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
SEARCH_ORCHESTRATOR_PORT=3002
FAVORITES_SERVICE_PORT=3003
AI_SERVICE_PORT=3004
VK_GATEWAY_PORT=8080
```

---

## Константы сервисов (не в .env)

**ai-service:**
```
DEFAULT_VISION_LIMIT = 20  // сколько фото анализирует vision-модель по умолчанию
```
Переопределяется значением `user_settings.vision_limit` из параметра задачи BullMQ.

---

## Команды разработки

```bash
# Запустить инфраструктуру (Redis + PostgreSQL)
docker compose up -d

# Запустить конкретный сервис с hot reload
pnpm --filter api-gateway dev
pnpm --filter auth-service dev
pnpm --filter search-orchestrator dev
pnpm --filter ai-service dev
pnpm --filter favorites-service dev

# Go сервис
cd services/vk-gateway && go run ./cmd/server

# Установить зависимости всего монорепо
pnpm install

# Добавить зависимость в конкретный сервис
pnpm --filter <service-name> add <package>
```

---

## Docker Compose

**`docker-compose.yml`** — только для локальной разработки:
- postgres (5432)
- redis (6379)

**`docker-compose.prod.yml`** — для деплоя:
- postgres, redis + все 6 сервисов
- Каждый Node.js сервис собирается из `services/<name>/Dockerfile`
- Go сервис — `services/vk-gateway/Dockerfile`

---

## Нерешённые вопросы (следующие этапы)

- Промпты для AI Service (парсинг текста, vision-анализ)
- CI/CD pipeline
