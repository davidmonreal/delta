# Engineering Guide

Purpose: keep code style, architecture, and data modeling consistent so the
codebase reads like it was written by one person with the same criteria.

## Principles
- Prefer clarity over cleverness; optimize only with evidence.
- Separate business rules from infrastructure; keep boundaries stable.
- Keep dependencies pointing inward (domain -> application -> infrastructure).
- Make behavior explicit and testable.

## Module structure (baseline)
- modules/<feature>/{domain,application,ports,infrastructure,dto}
- domain: policies, value objects, pure rules.
- application: use cases that orchestrate business rules.
- ports: interfaces for external services and repositories.
- infrastructure: Prisma or external adapters only.
- dto: schemas and boundary validation.

## SOLID focus
- SRP: each use case does one business action; repositories do data access only.
- OCP: extend behavior via strategies or policies, not large conditionals.
- LSP: keep interface contracts strict; do not widen types in implementations.
- ISP: split large repositories into query/command ports when they grow.
- DIP: application depends on ports; inject implementations at the edge.

## Design patterns (preferred)
- Strategy: matching, scoring, filtering, or formatting rules.
- Policy/Specification: authorization and visibility rules.
- Pipeline: ingestion or multi-step transformations.
- Factory: construction of adapters in API routes or server actions.
- Unit of Work/Transaction: multi-step writes that must be atomic.

## Coding style
- TypeScript first, explicit return types on boundary helpers.
- Use simple data shapes; avoid union bloat unless required.
- Prefer small pure functions with clear names.
- No business logic in API routes, server actions, or UI components.
- Keep comments rare and focused on business rationale.
- Keep functions 40-80 lines when possible; extract helpers if longer.

## Error and result handling
- Use a consistent Result type at the application boundary.
- Map Result to HTTP responses in routes or actions only.
- Do not throw for expected business errors.

## Repository rules
- Prisma usage only in infrastructure.
- Repositories return domain-friendly shapes, not Prisma types.
- One repository should not encode matching or normalization rules.
- Provide disconnect only where scripts or CLI flows need it.

## Data normalization
- Single source of truth for normalization rules.
- Normalize at boundaries (ingestion, creation, updates).
- Avoid re-normalizing inside repositories unless required for data repair.

## UI rules
- Presentation components remain props-driven.
- UI mapping and formatting happens outside business logic.
- Shared UI logic belongs in domain uiPolicies or application helpers.

## Tests
- Use case tests in application/__tests__ with in-memory ports.
- Prisma tests in infrastructure/__tests__ gated by RUN_DB_TESTS=1.
- Prefer deterministic data and avoid time-based flakiness.

## Database guidance
- Use numeric/decimal types for money; avoid float for totals.
- Add indexes based on query paths, not assumptions.
- Use enums for known status fields; avoid free-form strings.
- Add constraints for invariants (month 1..12, unique keys, etc).
- Prefer idempotent import keys to avoid duplicate data.

## Consistency checklist (quick)
- Ports define contracts; adapters implement without extra logic.
- Use cases own orchestration and policies.
- Matching/heuristics live in strategies or services, not repositories.
- Error messages are localized and consistent.
- Naming: camelCase for variables/functions; PascalCase for types/classes.
