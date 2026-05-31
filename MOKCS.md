# VK Search Mocks

`USE_MOCK_VK_SEARCH=true` подменяет только `SearchProfiles` в `services/vk-gateway`.
Остальные RPC (`ExchangeOAuthCode`, `GetProfile`, `GetCurrentProfile`) остаются реальными.

Каталог моков:

- 144 профиля
- `screenName` всегда вида `id<vkUserId>`
- ссылка на страницу строится как `https://vk.com/<screenName>`
- данные детерминированные: города, вузы, факультеты, возраст, relation, online status

## Запуск

Ты запускаешь стек через `pnpm dev:stack`, поэтому mock-режим нужно включать через `.env.dev`.

Добавь в `.env.dev`:

```bash
USE_MOCK_VK_SEARCH=true
```

Потом из корня репозитория:

```bash
pnpm dev:stack
```

Проверка health:

В отдельном терминале:

```bash
curl http://127.0.0.1:8080/health
```

## Поиск

При `pnpm dev:stack` gRPC `vk-gateway` живет внутри docker-сети, поэтому команды поиска удобнее запускать через `docker compose exec`.

Если стек уже поднят, список gRPC-сервисов:

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec vk-gateway \
  /usr/local/go/bin/go run github.com/fullstorydev/grpcurl/cmd/grpcurl@latest \
  -plaintext \
  vk-gateway:50054 \
  list
```

### Первая страница каталога

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec vk-gateway \
  /usr/local/go/bin/go run github.com/fullstorydev/grpcurl/cmd/grpcurl@latest \
  -plaintext \
  -d '{
    "filters": {},
    "page": { "pageSize": 5, "pageToken": "" },
    "accessToken": { "value": "mock-token" }
  }' \
  vk-gateway:50054 \
  findnmeet.vk.v1.VkGatewayService/SearchProfiles
```

### Все Анны из Москвы

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec vk-gateway \
  /usr/local/go/bin/go run github.com/fullstorydev/grpcurl/cmd/grpcurl@latest \
  -plaintext \
  -d '{
    "filters": {
      "query": "анна",
      "city": { "id": "1", "title": "Москва" }
    },
    "page": { "pageSize": 20, "pageToken": "" },
    "accessToken": { "value": "mock-token" }
  }' \
  vk-gateway:50054 \
  findnmeet.vk.v1.VkGatewayService/SearchProfiles
```

### Онлайн-Анны из МГУ, 20-32

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec vk-gateway \
  /usr/local/go/bin/go run github.com/fullstorydev/grpcurl/cmd/grpcurl@latest \
  -plaintext \
  -d '{
    "filters": {
      "query": "анна",
      "city": { "id": "1", "title": "Москва" },
      "university": { "id": "101", "title": "МГУ" },
      "ageFrom": 20,
      "ageTo": 32,
      "relation": "VK_RELATION_STATUS_SINGLE",
      "onlineOnly": true
    },
    "page": { "pageSize": 20, "pageToken": "" },
    "accessToken": { "value": "mock-token" }
  }' \
  vk-gateway:50054 \
  findnmeet.vk.v1.VkGatewayService/SearchProfiles
```

### Вторая страница

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec vk-gateway \
  /usr/local/go/bin/go run github.com/fullstorydev/grpcurl/cmd/grpcurl@latest \
  -plaintext \
  -d '{
    "filters": {},
    "page": { "pageSize": 20, "pageToken": "20" },
    "accessToken": { "value": "mock-token" }
  }' \
  vk-gateway:50054 \
  findnmeet.vk.v1.VkGatewayService/SearchProfiles
```

## Что смотреть в ответе

- `result.totalCount` должен быть больше `100`
- `result.profiles[].screenName` можно открывать как `https://vk.com/<screenName>`
- `page.nextPageToken` используется для пагинации

Пример, как сразу получить ссылки на страницы:

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec -T vk-gateway \
  /usr/local/go/bin/go run github.com/fullstorydev/grpcurl/cmd/grpcurl@latest \
  -plaintext \
  -d '{
    "filters": {
      "query": "анна",
      "city": { "id": "1", "title": "Москва" }
    },
    "page": { "pageSize": 5, "pageToken": "" },
    "accessToken": { "value": "mock-token" }
  }' \
  vk-gateway:50054 \
  findnmeet.vk.v1.VkGatewayService/SearchProfiles \
  | jq -r '.result.profiles[] | "https://vk.com/\(.screenName)"'
```
