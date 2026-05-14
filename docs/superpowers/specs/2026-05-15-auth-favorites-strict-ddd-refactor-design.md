# Auth And Favorites Strict DDD Refactor Design

## Goal

Refactor `services/auth-service` and `services/favorites-service` to strict DDD boundaries as defined in `AGENTS.md`.

Target constraints:

- `domain` knows only its own model, rules, and domain-defined ports.
- `application` coordinates use cases through domain and application ports.
- `infrastructure` implements ports and contains all technical details.
- `interfaces` contains transport-specific adapters such as gRPC controllers, metadata readers, filters, and protobuf mappers.

This refactor is structural and architectural. It must preserve existing gRPC contracts and current service behavior.

## Scope

In scope:

- `services/auth-service`
- `services/favorites-service`
- their tests
- internal module wiring

Out of scope:

- changing public protobuf contracts
- adding new business features
- changing persistence schema unless strictly required for architectural cleanup
- refactoring unrelated services

## Target Service Structure

Each service should converge on the same top-level layout:

```text
src/
├── app.module.ts
├── bootstrap/
│   └── grpc-server.ts
├── index.ts
├── interfaces/
│   └── grpc/
│       ├── controllers/
│       ├── filters/
│       ├── mappers/
│       └── metadata/
├── <bounded-context>/
│   ├── domain/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── services/
│   │   ├── errors/
│   │   └── ports/
│   ├── application/
│   │   ├── commands/
│   │   ├── queries/
│   │   ├── use-cases/
│   │   ├── dto/
│   │   └── ports/
│   └── infrastructure/
│       ├── persistence/
│       │   ├── entities/
│       │   ├── mappers/
│       │   └── repositories/
│       ├── providers/
│       └── security/
└── migrations/
```

Rules:

- `interfaces` may depend on `application`.
- `infrastructure` may depend on `application` and `domain`.
- `application` may depend on `domain`.
- `domain` must not depend on `application`, `infrastructure`, or `interfaces`.

## Auth Service Design

### Domain

`auth/domain` will contain only business model and domain-level contracts.

Entities:

- `user`
- `user-external-link`
- `auth-token`
- `auth-session`

Value objects:

- `provider`
- `user-status`

Domain ports:

- `UserRepository`
- `ExternalLinkRepository`
- `AuthTokenRepository`
- `AuthSessionRepository`

Domain responsibilities:

- represent authenticated user state
- represent external identity link state
- represent token and session state as domain concepts
- enforce domain invariants such as user status checks and identity uniqueness assumptions at model/use-case boundaries

Domain must not import:

- NestJS
- TypeORM
- protobuf types
- gRPC metadata
- crypto helpers

### Application

`auth/application` will orchestrate scenarios as separate use cases rather than one service-class with multiple responsibilities.

Use cases:

- `CompleteVkOAuthUseCase`
- `GetUserUseCase`
- `GetExternalLinksUseCase`
- `RefreshSessionUseCase`
- `RevokeSessionUseCase`

Application DTO:

- request command/query objects for each use case
- result DTO objects returned to interfaces

Application ports:

- `VkOAuthProvider`
- `AccessTokenIssuer`
- `RefreshTokenManager`
- `UnitOfWork` if transaction orchestration cannot stay implicit in repository adapter boundaries

Application responsibilities:

- validate required input for use case execution
- coordinate repository calls
- call external providers through ports
- map domain objects into application result DTO

Application must not import:

- TypeORM `Repository`
- `.entity` classes
- protobuf request or response types
- Nest transport decorators

### Infrastructure

`auth/infrastructure` will own all technical implementations.

Persistence:

- TypeORM entities
- entity-to-domain mappers
- domain-to-entity mappers
- TypeORM repository implementations for domain ports

Security:

- JWT access token issuer implementation
- refresh token manager implementation
- token crypto helpers

Providers:

- VK gateway gRPC client implementing `VkOAuthProvider`

Infrastructure responsibilities:

- database storage and retrieval
- encryption and signing details
- transport to external systems
- transaction execution where required

### Interfaces

`interfaces/grpc` will contain:

- controllers
- protobuf mappers
- metadata readers
- RPC exception filters

Responsibilities:

- decode protobuf request into application command/query
- call use case
- map application result DTO into protobuf response
- read request metadata such as current user id

Controllers must not:

- access TypeORM
- contain business rules
- call infrastructure adapters directly

### Bootstrap

`bootstrap` will contain transport assembly code that wires Nest application startup to the chosen transport.

Examples:

- gRPC server options
- global filter registration
- health-check wiring during startup

Bootstrap responsibilities:

- create the Nest application or microservice
- attach transport-specific options
- register global transport-level wiring

Bootstrap must not contain:

- business rules
- persistence logic
- protobuf mapping logic

## Favorites Service Design

### Domain

`favorites/domain` will remain the center of favorite business rules.

Entities:

- `favorite`
- `vk-profile-snapshot` as an entity or value object depending on current invariants

Value objects:

- `favorite-provider`
- pagination token value objects if treated as business concepts; otherwise keep pagination parsing outside domain

Domain ports:

- `FavoritesRepository`

Domain responsibilities:

- create and evolve favorite state
- validate provider constraints
- validate supported update masks and snapshot invariants

### Application

Use cases:

- `CreateFavoriteUseCase`
- `GetFavoriteUseCase`
- `ListFavoritesUseCase`
- `UpdateFavoriteUseCase`
- `DeleteFavoriteUseCase`
- `RefreshFavoriteUseCase`

Application ports:

- `ProfileSnapshotProvider`

Application responsibilities:

- coordinate favorite lifecycle scenarios
- request snapshot refresh through provider port
- assemble result DTO for interfaces

Application must not import:

- protobuf request or response types
- TypeORM entity classes
- transport metadata readers

### Infrastructure

Persistence:

- `favorite.entity.ts`
- TypeORM repository implementation
- entity mappers
- storage-specific provider code mapping

Providers:

- VK profile provider implementation over gRPC or HTTP client

Infrastructure responsibilities:

- persistence model details
- storage-specific pagination token handling if it is a persistence concern
- external provider integration details

### Interfaces

All `src/grpc/*` files move under `src/interfaces/grpc/*`, except transport assembly which moves to `src/bootstrap/*`.

Responsibilities:

- map protobuf requests into application commands and queries
- extract current user id from gRPC metadata
- map use case DTOs back into protobuf responses

## Data Flow

### Auth Service

Request flow:

1. gRPC controller receives protobuf request.
2. Interface mapper converts protobuf to application command/query.
3. Use case coordinates domain and ports.
4. Infrastructure adapters implement repository and provider operations.
5. Use case returns application result DTO.
6. Interface mapper converts result DTO to protobuf response.
7. Bootstrap-wired transport returns the encoded gRPC response.

### Favorites Service

Request flow:

1. gRPC controller receives protobuf request and metadata.
2. Interface layer extracts user id and builds application command/query.
3. Use case loads or mutates domain objects through repository port.
4. Infrastructure repository and provider adapters execute technical work.
5. Use case returns application DTO.
6. Interface mapper encodes protobuf response.
7. Bootstrap-wired transport returns the encoded gRPC response.

## Migration Plan

### Phase 1: Auth Service As Reference Implementation

1. Finalize `interfaces/grpc` and `bootstrap` structure.
2. Split current application service into individual use cases.
3. Introduce domain and application ports.
4. Move persistence and external integrations behind infrastructure adapters.
5. Replace entity leakage from application results with domain/application DTO.
6. Update tests to cover use cases directly and keep gRPC tests focused on transport mapping.

### Phase 2: Favorites Service Alignment

1. Move `grpc` into `interfaces/grpc`.
2. Verify all application code depends only on ports and domain models.
3. Isolate TypeORM and provider integration into infrastructure.
4. Normalize naming and folder structure to match auth-service.
5. Update tests using the same layering principles.

### Phase 3: Cleanup And Verification

1. Remove obsolete folders and transitional mappers.
2. Ensure `app.module.ts` only wires dependencies.
3. Verify no reverse imports violate DDD boundaries.
4. Verify runtime behavior and gRPC contracts remain unchanged.

## Testing Strategy

Tests should be split by layer.

Domain tests:

- no Nest
- no database
- no protobuf

Application tests:

- use mocked ports
- verify orchestration behavior per use case

Interface tests:

- verify protobuf-to-command mapping
- verify DTO-to-protobuf mapping
- verify metadata extraction and transport filter behavior

Infrastructure tests:

- verify repository implementations
- verify external provider adapters
- verify token and crypto adapters

Regression checks:

- current gRPC contract tests stay green
- existing build commands stay green

## Risks

Main risks:

- hidden `application -> infrastructure` dependencies through imported types
- duplicated mapping logic spread across layers
- over-thin use cases that still rely on old god-services
- contract regressions in protobuf mapping
- transport assembly and runtime config leaking back into interfaces

Risk controls:

- protobuf mappers live only in `interfaces`
- entity mappers live only in `infrastructure`
- use cases return DTO/domain objects only
- startup and transport wiring live only in `bootstrap`
- imports are reviewed for layer violations after each phase

## Done Criteria

The refactor is complete only if all of the following are true.

Domain:

- no imports from Nest, TypeORM, protobuf, or gRPC

Application:

- no imports of TypeORM repositories or entity classes
- no imports of protobuf request or response types
- use cases are split by scenario

Infrastructure:

- all DB and external-system logic is implemented here
- repository implementations satisfy ports defined above

Interfaces:

- controllers call only use cases
- mappers stay transport-specific

Bootstrap:

- transport startup lives here, not in `interfaces`
- env-backed server assembly for gRPC lives here, not in domain or application

Verification:

- `auth-service` tests pass
- `favorites-service` tests pass
- build passes for both services
- gRPC transport behavior is preserved
