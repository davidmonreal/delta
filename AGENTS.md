# AGENTS

## Project context
- Repo root: /Users/davidmonreal/Projects/busbac
- Purpose: workspace for multiple client projects (each in its own folder)
- Current client project: `delta/` (Git repo with its own remote)

## How to work
- Make changes inside the client folder unless asked otherwise.
- Keep edits small and focused; avoid destructive git commands unless requested.
- Do not change or remove user edits.
- Follow SOLID, use design patterns when they clarify intent and testability.
- Prefer TDD when feasible; keep tests close to the code they cover.
- Naming: semantic `camelCase` for variables/functions, `PascalCase` for types/classes.
- Keep modules small, cohesive, and easy to test.
- Add brief code comments to capture business rationale when it affects design choices.

## Git and GitHub
- Prefer one GitHub repo per client project unless the user asks for a monorepo.
- Default branch: `main` for new repos; align with GitHub defaults.
- The agent can run `git push` only when the user explicitly asks.

## Structure
- Create new client projects under their own folders (e.g., `delta/`).
- If a project needs a template or stack, ask before scaffolding.
- UI components live in `src/components` with reusable pieces in `src/components/common` (Tailwind + lucide-react); prefer reuse over one-off markup.

## Architecture practices (new baseline)
- Follow a layered structure: `modules/<feature>/{domain,application,ports,infrastructure,dto}`.
- Keep Prisma usage inside `infrastructure/` and expose repositories via `ports/`.
- Use cases live in `application/` and receive repositories/ports via injection.
- Validate inputs at boundaries using Zod schemas in `dto/`.
- UI/server actions must not contain business logic; they call use cases and map DTOs.
- Domain policies (authz rules) live in `domain/` and are reused by use cases.

## Testing practices
- Add unit tests for use cases using an in-memory repository + stub ports.
- Prefer `vitest` for new tests; keep tests near the feature in `application/__tests__/`.

## Scripts
- CLI scripts must use use cases + repositories; no direct Prisma calls in scripts.
