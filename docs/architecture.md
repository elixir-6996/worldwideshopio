# Architecture

This document describes the high-level architecture of the application and the
engineering foundation that supports it.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack, React 19)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4 with a token-based design system in `app/globals.css`
- **UI primitives:** Base UI (`@base-ui/react`) wrapped in `components/ui/*`
- **Validation:** Zod (runtime schema validation, including environment config)
- **Testing:** Vitest + React Testing Library (unit/component), Playwright (e2e)
- **Tooling:** ESLint (flat config) + Prettier, enforced via Husky + lint-staged

## Directory layout

```
app/                 # App Router routes, layouts, and pages
components/
  ui/                # Reusable, presentational UI primitives (Base UI wrappers)
  *.tsx              # Feature/composite components (navbar, footer, cards, ...)
lib/                 # Framework-agnostic modules
  env.ts             # Validated, typed environment configuration
  errors.ts          # AppError hierarchy + normalization helpers
  logger.ts          # Structured logging abstraction
  store.ts           # Product data + domain types
  utils.ts           # Shared helpers (cn, ...)
docs/                # Engineering documentation (this folder)
test/                # Test setup shared across Vitest suites
e2e/                 # Playwright end-to-end specs
```

## Layered design

1. **Presentation** (`app/`, `components/`) — server and client React components.
   Client components are marked with `"use client"`.
2. **Domain / data** (`lib/store.ts`) — product catalog and domain types. This is
   where a real database layer would be integrated.
3. **Cross-cutting concerns** (`lib/env.ts`, `lib/errors.ts`, `lib/logger.ts`) —
   configuration, error modeling, and logging used across every layer.

## Configuration & secrets

All environment access goes through `lib/env.ts`, which validates variables with
Zod at first use and exposes a typed `env` object. Never read `process.env`
directly in feature code — import from `lib/env.ts` so missing/misconfigured
values fail fast with a clear message. See `.env.example` for the full list.

## Error handling

Domain and infrastructure failures are represented with the `AppError` hierarchy
in `lib/errors.ts`. Use `toAppError()` to normalize unknown thrown values and
`logger` (`lib/logger.ts`) to record them with structured context. This keeps
error semantics (status codes, operational vs. programmer errors) consistent.
