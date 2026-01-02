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
