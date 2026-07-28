import next from 'eslint-config-next'
import prettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

/**
 * ESLint flat configuration for Next.js 16.
 *
 * - `eslint-config-next` bundles the Next.js, React, React Hooks, import and
 *   jsx-a11y rule sets (including `core-web-vitals`) as a flat-config array.
 * - `eslint-config-prettier` is applied last so that any stylistic rules that
 *   would conflict with Prettier are turned off. Formatting is owned by
 *   Prettier, correctness is owned by ESLint.
 */
const config = [
  // Global ignores. Must be an object containing only `ignores` to apply globally.
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
    ],
  },

  ...next,

  // Project-wide rule overrides that enforce our quality bar.
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // Strictness: never allow the `any` escape hatch.
      '@typescript-eslint/no-explicit-any': 'error',
      // Prefer explicit handling of unused values; allow leading underscore opt-out.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Tooling and test files may use console and dev dependencies freely.
  {
    files: [
      '**/*.config.{js,mjs,ts}',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      'e2e/**',
      'scripts/**',
      'lib/logger.ts',
    ],
    rules: {
      'no-console': 'off',
    },
  },

  // Must be last so it can disable formatting-related rules from configs above.
  prettier,
]

export default config
