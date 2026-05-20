# AI Service Parse Search Query With Gemini

## Context

`services/ai-service` already contains partial code for a `search-query` bounded context, gRPC bootstrap, and protobuf mappers, but the implementation is incomplete and currently violates DDD boundaries:

- Google AI access is created directly inside an infrastructure class via `process.env`.
- Domain/application code is mixed with generated protobuf types.
- There is no working gRPC controller for `findnmeet.ai.v1.AiService.ParseSearchQuery`.
- The existing protobuf response cannot explicitly represent a product-level clarification response for low-quality prompts.

The goal of this change is to make `ai-service` provide a working `ParseSearchQuery` use case backed by Gemini through `@ai-sdk/google`, while keeping layering strict:

- domain is pure and framework-free;
- application coordinates the use case and owns pre-AI guard logic;
- infrastructure contains Gemini SDK access and configuration;
- interfaces/grpc maps protobuf transport to application inputs and outputs.

## Goals

- Implement a working gRPC method `AiService.ParseSearchQuery`.
- Configure Gemini through `GEMINI_API_KEY` and `AI_MODEL`.
- Keep Google-specific code out of domain and application.
- Parse natural-language requests into `findnmeet.search.v1.SearchCriteria` and `findnmeet.vk.v1.VkSearchFilters`.
- Detect empty and obviously low-signal prompts before calling Gemini.
- Return a normal product response for clarification-worthy prompts instead of a gRPC error.

## Non-Goals

- No HTTP API for this use case in `ai-service`.
- No persistence layer for parsed criteria.
- No Vertex AI, service account, or Google Cloud project integration.
- No multilingual prompt-tuning project beyond the minimal parser behavior needed for Russian-language search input.
- No changes to `search-orchestrator` or `api-gateway` integration in this task.

## Contracts

### Existing Request Contract

`findnmeet.ai.v1.ParseSearchQueryRequest` remains:

- `user_id`
- `query`

### Required Response Contract Change

`findnmeet.ai.v1.ParseSearchQueryResponse` must be extended so the service can return a product-level clarification response without overloading gRPC transport semantics.

Add:

- `status`
- `message`
- `criteria`

Proposed shape:

```proto
message ParseSearchQueryResponse {
  ParseSearchQueryStatus              status = 1;
  string                              message = 2;
  .findnmeet.search.v1.SearchCriteria criteria = 3;
}
```

Add a new enum:

```proto
enum ParseSearchQueryStatus {
  PARSE_SEARCH_QUERY_STATUS_UNSPECIFIED = 0;
  PARSE_SEARCH_QUERY_STATUS_PARSED = 1;
  PARSE_SEARCH_QUERY_STATUS_NEEDS_CLARIFICATION = 2;
}
```

Semantics:

- `PARSED`: Gemini was called or deterministic parsing succeeded, and `criteria` represents a usable search intent.
- `NEEDS_CLARIFICATION`: the prompt was too weak to parse usefully, Gemini was not called, and `message` contains the standard guidance.

`criteria` remains present in both cases. In clarification mode it contains a safe placeholder result with:

- generated `id`
- original `raw_query`
- `parsed_at`
- `vk_filters.query` set to normalized user input or empty string
- all optional filters unset
- `relation` set to `VK_RELATION_STATUS_UNSPECIFIED`
- `online_only` set to `false`

## Domain Design

The `search-query` bounded context remains the center of the use case.

### Domain Models

Keep or refine pure domain models:

- `SearchCriteria`
- `VkSearchFilters`
- `VkReference`
- `VkRelationStatus`

The domain layer must not know:

- protobuf schemas
- NestJS decorators
- `@ai-sdk/google`
- `zod`
- `process.env`

## Application Design

### Main Use Case

`ParseSearchQueryUseCase` remains the entry point for the bounded context.

Responsibilities:

- normalize raw input;
- run a deterministic prompt-quality guard before AI;
- return a clarification result when the prompt is empty or obviously low-signal;
- call the AI parser port only for valid prompts;
- wrap the resulting filters into `SearchCriteria`;
- return a result model that transport can map to protobuf.

Add an application-level result model representing the use-case outcome without importing protobuf types:

- `ParsedSearchQueryResult`

Proposed shape:

- `status: 'PARSED' | 'NEEDS_CLARIFICATION'`
- `message?: string`
- `criteria: SearchCriteria`

### Guard Rules

The application layer owns the pre-AI guard because this is product behavior, not transport behavior and not a Gemini concern.

The guard should classify as `NEEDS_CLARIFICATION`:

- empty string;
- string containing only whitespace;
- strings made only of punctuation or separators;
- obviously content-free prompts such as single tokens with no search semantics when they are confidently detectable.

The initial implementation should stay conservative. It is better to send a borderline prompt to Gemini than to reject a potentially meaningful search.

Standard clarification message:

`Сформулируй запрос подробнее: укажи, кого ищешь и, если знаешь, добавь город, вуз, возраст или другие детали.`

### Application Port

Keep the abstraction:

- `AiSearchQueryParser`

It should return pure domain filters:

- `Promise<VkSearchFilters>`

It must not expose SDK-level or protobuf-level types.

## Infrastructure Design

### Gemini Configuration

Configuration belongs in infrastructure/composition root.

Use:

- `GEMINI_API_KEY`
- `AI_MODEL`

At startup:

- if `GEMINI_API_KEY` is missing, fail fast;
- if `AI_MODEL` is missing, fail fast.

This is a deployment/configuration error, not a runtime use-case response.

### Gemini Adapter

Create an infrastructure adapter implementing `AiSearchQueryParser`.

Responsibilities:

- build the Gemini model from injected config;
- send a structured prompt;
- validate model output against a local schema;
- map validated output into domain `VkSearchFilters`;
- raise infrastructure/application boundary errors when the model output is malformed or the SDK call fails.

### Output Validation

Validation should be local to infrastructure and independent from generated protobuf artifacts.

Use a schema for the expected AI response shape, including:

- `query`
- optional `city`
- optional `country`
- optional `university`
- optional `faculty`
- optional `ageFrom`
- optional `ageTo`
- optional `graduationYear`
- `relation`
- `onlineOnly`

Reference objects should validate:

- `id`
- `title`

The adapter is responsible for mapping validated scalar values into domain types, including conversion of numeric IDs into the domain representation used by `VkReference`.

### Prompt Strategy

The prompt should instruct Gemini to:

- extract only what is explicitly present or strongly implied;
- keep unknown fields empty;
- never invent ids or titles;
- preserve the meaningful search phrase in `query`;
- use enum-compatible relation values;
- return only structured data.

Alias dictionaries such as city/university helpers remain infrastructure concerns and may be used to stabilize parsing if already present.

## Interfaces / gRPC Design

### gRPC Controller

Add a Nest gRPC controller for `findnmeet.ai.v1.AiService`.

Responsibilities:

- accept `ParseSearchQueryRequest`;
- validate presence of `user_id.value` and `query` at transport level where needed;
- map request into application input;
- call `ParseSearchQueryUseCase`;
- map the application result into `ParseSearchQueryResponse`.

### gRPC Error Mapping

Use gRPC errors only for real technical or contract-level failures.

Return gRPC error:

- `INVALID_ARGUMENT` for malformed transport input such as a missing `user_id`;
- `INTERNAL` for unexpected infrastructure failures or invalid model output that cannot be converted into a safe domain result.

Do not use gRPC errors for weak prompts. Those must return `NEEDS_CLARIFICATION`.

### Mapper Updates

Extend the existing protobuf mapper to support:

- response `status`;
- response `message`;
- mapping from application result model to protobuf enum;
- request `user_id` extraction into the use case input.

The mapper stays in `interfaces/grpc` and is the only place aware of generated protobuf schemas for this use case.

## Module Wiring

`AppModule` should become the composition root for the use case.

It should wire:

- the gRPC controller;
- `ParseSearchQueryUseCase`;
- the `AiSearchQueryParser` implementation;
- Gemini config provider/factory.

Use Nest DI so that:

- application depends on abstractions;
- infrastructure implementation is bound in the module;
- config is injected, not read ad hoc from the parser class.

## Bootstrap

`ai-service` should run the Nest gRPC server as the main runtime path for this task.

Health handling may remain separate, but the service must start the gRPC bootstrap that serves:

- `findnmeet.ai.v1.AiService`
- gRPC health check

If the current Express health app is retained, it must not become the main entry point for the parsing use case.

## Testing Strategy

### Unit Tests

Add or update tests for:

- prompt-quality guard behavior in the use case;
- `ParseSearchQueryUseCase` happy path;
- clarification path without AI invocation;
- mapper request/response transformations;
- Gemini adapter output validation and mapping.

### Integration / Smoke Tests

Add at least one service-level test proving:

- a valid request returns `PARSED` with `criteria`;
- an empty or low-signal request returns `NEEDS_CLARIFICATION` with the standard message and does not require Gemini.

The low-signal clarification path should be testable without live Google access.

Avoid tests that require real Gemini network calls in CI.

## File-Level Change Plan

Expected touched areas:

- `contracts/proto/findnmeet/ai/v1/parse_search_query_response.proto`
- new `contracts/proto/findnmeet/ai/v1/parse_search_query_status.proto`
- `contracts/proto/findnmeet/ai/v1/service.proto` if imports need adjustment
- regenerated `packages/ts-types/.gen/*`
- `services/ai-service/src/app.module.ts`
- `services/ai-service/src/bootstrap/*` as needed
- `services/ai-service/src/interfaces/grpc/*`
- `services/ai-service/src/search-query/application/*`
- `services/ai-service/src/search-query/domain/*`
- `services/ai-service/src/search-query/infrastracture/ai/*`
- `.env.example`

## Acceptance Criteria

- `AiService.ParseSearchQuery` is callable over gRPC.
- The service reads `GEMINI_API_KEY` and `AI_MODEL` from configuration and fails fast if they are missing.
- Domain and application code do not import protobuf-generated types or Google SDK types.
- Empty and obviously weak prompts return `NEEDS_CLARIFICATION` with the standard message and a placeholder `criteria`.
- Valid prompts return `PARSED` and a populated `criteria`.
- Gemini output is validated before mapping into domain objects.
- Tests cover both parsed and clarification paths without requiring live Google access.

## Risks And Mitigations

- False positives in the low-signal guard can suppress useful prompts.
  Mitigation: keep the first version conservative and prefer Gemini when uncertain.

- Gemini may return structurally invalid data.
  Mitigation: validate with a strict infrastructure schema and fail predictably.

- Proto evolution may ripple into generated TypeScript imports.
  Mitigation: keep transport changes isolated to AI service contracts and regenerate types immediately.

- Existing uncommitted changes in `services/ai-service` may overlap with implementation.
  Mitigation: implementation must inspect and preserve those edits instead of overwriting them.
