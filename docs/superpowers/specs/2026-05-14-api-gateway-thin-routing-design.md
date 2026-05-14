# API Gateway Thin Routing Design

## Goal

Refactor `services/api-gateway` into a thin edge service that:

- validates user access JWTs locally;
- extracts request context such as `userId` and optional roles from the token;
- forwards requests to downstream gRPC services without duplicating domain or application logic;
- stops owning auth-domain token issuance code currently leaking through `packages/utils`.

## Architectural Decision

`api-gateway` follows a thin `interfaces + infrastructure` shape.

- `interfaces` responsibility:
  - HTTP controllers
  - request validation
  - auth guard
  - request context extraction
- `infrastructure` responsibility:
  - gRPC clients
  - JWT verification helpers
  - metadata propagation to downstream services

`api-gateway` does not define domain services such as `AuthGatewayService` or `FavoritesGatewayService`.

## Layering Rules

- Domain code stays inside domain services such as `auth-service` and `favorites-service`.
- `api-gateway` controllers may call transport-facing clients only.
- `api-gateway` must not contain business workflows, persistence logic, or domain mappers.
- Shared package `packages/utils` must not contain auth-domain token issuance or verification code.

## Token Model

- Access token is a standard JWT.
- `auth-service` signs access tokens with a private key.
- `api-gateway` verifies access tokens locally with the matching public key.
- `api-gateway` checks:
  - Bearer format or configured cookie source
  - JWT structure
  - signature
  - `exp`
- `api-gateway` extracts:
  - `sub` as current user id
  - optional `roles`

Refresh tokens remain an auth-service concern.

## Request Flow

1. HTTP request arrives at `api-gateway`.
2. Guard extracts JWT from `Authorization: Bearer <token>` or access-token cookie.
3. Guard verifies signature and expiry.
4. Guard stores request auth context.
5. Controller forwards the request to the correct downstream gRPC service.
6. gRPC client forwards `x-user-id`, optional `x-user-roles`, and `x-request-id` metadata.
7. Response is returned with minimal transport shaping only.

## Scope Of Refactor

- Remove `AuthGatewayService`.
- Remove `FavoritesGatewayService`.
- Keep HTTP controllers, but make them thin transport adapters.
- Keep gRPC clients, but restrict them to request forwarding and metadata propagation.
- Move user-token implementation out of `packages/utils` into `auth-service`.
- Replace shared-secret access-token verification in `api-gateway` with public-key JWT verification.

## Non-Goals

- No new domain behavior in `api-gateway`.
- No role-based authorization policy engine in `api-gateway`.
- No database access from `api-gateway`.
- No BFF-specific response shaping beyond minimal transport compatibility.

## Validation

- `api-gateway` tests cover JWT extraction and verification behavior.
- Existing auth/favorites flows still compile and pass targeted tests after refactor.
