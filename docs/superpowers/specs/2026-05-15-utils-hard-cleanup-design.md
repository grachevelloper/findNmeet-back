# Utils Hard Cleanup Design

## Goal

Refactor `packages/utils` into a strictly shared, framework-agnostic package.

After the cleanup, `packages/utils` should contain only helpers that are:

- reusable across multiple services;
- independent from NestJS, gRPC, HTTP, cookies, and controller decorators;
- independent from auth-specific and favorites-specific transport mapping.

The cleanup must preserve current runtime behavior while removing architectural leakage from the shared package.

## Problem

`packages/utils` currently mixes several different responsibilities:

- neutral shared helpers such as health response building and PostgreSQL URL resolution;
- NestJS HTTP exceptions;
- gRPC transport wiring and filters;
- API gateway HTTP cookie and response shaping helpers;
- auth-specific VK OAuth flow logic;
- favorites-specific and auth-specific response mappers.

This breaks the intended layering from `AGENTS.md` because a shared package exposes transport details and service-specific behavior through a common dependency.

## Decision

Use a hard cleanup rather than a partial export cleanup.

That means:

- keep only neutral shared helpers in `packages/utils`;
- move transport-specific and service-specific files into the owning services;
- reduce `packages/utils/src/index.ts` to shared exports only;
- remove transport-oriented peer dependencies from `packages/utils/package.json` when no longer needed.

## Target Package Boundary

`packages/utils` may contain:

- `health/health-response.ts`
- `config/postgres.ts`
- `time/*` helpers that do not depend on NestJS or service-specific transport code
- `pagination/page-size.ts`
- string helpers only if they are framework-agnostic

`packages/utils` must not contain:

- NestJS decorators
- NestJS exceptions
- gRPC filters or server registration helpers
- HTTP cookie helpers
- HTTP response mappers for auth or favorites
- auth-service OAuth orchestration code

## File Relocation Plan

### Move To `services/auth-service`

- `packages/utils/src/auth/oauth-flow.ts`
- auth-specific transport or exception helpers currently consumed only by `auth-service`

Target locations:

- OAuth flow logic under `src/auth` or `src/interfaces/http`, depending on the final call site
- gRPC helpers under `src/interfaces/grpc` or `src/bootstrap`

Rule:

- if code is specific to the auth bounded context, it belongs inside `auth-service`

### Move To `services/favorites-service`

- gRPC helpers currently used only by `favorites-service`
- favorites-specific transport-facing helpers currently exposed through `@findnmeet/utils`

Target locations:

- gRPC filters and health setup under `src/interfaces/grpc` or `src/bootstrap`
- HTTP or transport validation helpers near the interface layer that uses them

Rule:

- if code exists only to support favorites transport or favorites validation, it belongs inside `favorites-service`

### Move To `services/api-gateway`

- `packages/utils/src/http/*`
- `packages/utils/src/current-user-id.decorator.ts`

Target locations:

- cookie helpers under `src/interfaces/http`
- auth/favorites HTTP response mappers under controller-adjacent mapper modules
- request decorators under `src/interfaces/http`

Rule:

- if code shapes HTTP requests or responses, it belongs in the gateway interface layer

## Handling Of Mixed Helpers

Some helpers are structurally small but still transport-coupled because they throw `Nest` exceptions.

Examples:

- `strings/normalize-external-id.ts`
- `pagination/parse-page-size.ts`
- `errors/http-errors.ts`

These should not stay in `packages/utils` in their current form.

Decision:

- move them next to the interface or application code that uses them;
- only keep them shared if they are rewritten to return plain values or domain/application-safe errors without NestJS dependencies.

For this cleanup, prefer relocation over redesign unless a framework-agnostic rewrite is trivial.

## Import And Dependency Rules After Cleanup

After cleanup:

- services may still depend on `@findnmeet/utils` for neutral helpers only;
- no service should import NestJS transport helpers from `@findnmeet/utils`;
- `packages/utils/package.json` should no longer require peer dependencies such as:
  - `@nestjs/common`
  - `@nestjs/microservices`
  - `@grpc/grpc-js`
  - `grpc-health-check`
  - `rxjs`

if those dependencies are no longer used by the package.

## Migration Steps

1. Move service-specific files into their owning services.
2. Update imports in all affected services and tests.
3. Trim `packages/utils/src/index.ts` to shared exports only.
4. Delete orphaned files from `packages/utils/src`.
5. Remove stale dependencies from `packages/utils/package.json`.
6. Run targeted builds or tests for the changed services and shared package.

## Validation

Minimum validation after the refactor:

- `packages/utils` builds successfully
- `auth-service` builds or passes targeted tests
- `favorites-service` builds or passes targeted tests
- `api-gateway` builds or passes targeted tests
- search for `@findnmeet/utils` no longer shows imports of auth, grpc, or http-specific helpers

## Non-Goals

- introducing a new shared transport package
- redesigning service contracts
- changing protobuf schemas
- changing business behavior
- broad refactors outside the current `packages/utils` leakage
