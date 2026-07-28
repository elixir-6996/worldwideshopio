# Coding Standards

## Tooling

| Concern      | Tool                 | Command             |
| ------------ | -------------------- | ------------------- |
| Linting      | ESLint (flat config) | `pnpm lint`         |
| Auto-fix     | ESLint               | `pnpm lint:fix`     |
| Formatting   | Prettier             | `pnpm format`       |
| Format check | Prettier             | `pnpm format:check` |
| Types        | `tsc --noEmit`       | `pnpm typecheck`    |
| Unit tests   | Vitest               | `pnpm test`         |
| E2E tests    | Playwright           | `pnpm e2e`          |

Formatting is owned by **Prettier**; correctness and best practices are owned by
**ESLint**. `eslint-config-prettier` is applied last so the two never conflict.

## Enforcement

A Husky `pre-commit` hook runs:

1. `lint-staged` — ESLint `--fix` + Prettier on staged files only.
2. `tsc --noEmit` — a full type check.

Commits are blocked if either step fails. This keeps the main branch green
without relying solely on CI.

## Conventions

- **TypeScript strict mode** is on. Do not use `any` (`@typescript-eslint/no-explicit-any` is an error).
- **Unused variables** are errors. Prefix intentionally-unused identifiers with `_`.
- **No stray `console`** in app code — use `logger` from `lib/logger.ts`. `console.warn`/`console.error` are allowed; test and tooling files are exempt.
- **Environment variables** are read only through `lib/env.ts`.
- **Errors** thrown in domain/infra code should extend `AppError` (`lib/errors.ts`).
- **UI primitives** live in `components/ui/` and wrap Base UI. Composite/feature components live directly under `components/`.
- Prefer **flexbox** for layout and the Tailwind spacing scale over arbitrary values.

## `asChild` on primitives

The `components/ui` primitives wrap Base UI, which uses a `render` prop instead
of Radix's `asChild`. Our `Button`, `SheetTrigger`, and `SheetClose` wrappers
accept an `asChild` prop and map it to Base UI's `render` for you, so you can
write the familiar pattern:

```tsx
<Button asChild>
  <Link href="/products">Shop</Link>
</Button>
```
