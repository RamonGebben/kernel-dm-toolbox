import { defineConfig, globalIgnores } from 'eslint/config';
import next from '@pindakaasman/eslint-config/next';
import storybook from '@pindakaasman/eslint-config/storybook';

const eslintConfig = defineConfig([
  ...next,
  ...storybook,
  {
    rules: {
      // Functions and plain data: no classes, no enums.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ClassDeclaration',
          message:
            'This codebase is functions and plain data — no classes. See CLAUDE.md.',
        },
        // Repeated from the shared config: a rule's options are replaced, not
        // merged, so the class ban above would otherwise drop the enum ban.
        {
          selector: 'TSEnumDeclaration',
          message:
            "Use a union of string literals instead of enum - see the typescript plugin's conventions skill.",
        },
      ],
      // An underscore prefix is the codebase's marker for "deliberately
      // discarded" — the rest-destructure that drops a join key, for example.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      // `process.env` is read in exactly one place: src/env.ts.
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message:
            "Import the parsed `env` from '~/env' instead of reading process.env.",
        },
      ],
    },
  },
  {
    // The boundary where raw process.env access is the point:
    //  - src/env.ts is what everything else reads through
    //  - src/instrumentation.ts reads NEXT_RUNTIME (injected by Next, not part
    //    of the app schema) and SKIP_ENV_VALIDATION, which by definition has to
    //    be read before env parsing happens
    //  - config files and CLI scripts run outside the app's module graph
    files: [
      'src/env.ts',
      'src/instrumentation.ts',
      '*.config.{ts,mts,mjs}',
      '.storybook/**',
      'src/server/db/migrate.ts',
      'src/server/db/import.ts',
      'scripts/**',
    ],
    rules: {
      'no-restricted-properties': 'off',
    },
  },
  globalIgnores([
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'src/server/db/migrations/**',
  ]),
]);

export default eslintConfig;
