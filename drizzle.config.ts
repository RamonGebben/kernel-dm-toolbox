import { defineConfig } from 'drizzle-kit';

/**
 * Schema changes are code: edit `schema.ts`, run `pnpm db:generate`, and commit
 * the generated SQL so the change is reviewable in a pull request. Nothing is
 * ever applied by hand to a live database.
 */
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/server/db/schema.ts',
  out: './src/server/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'file:.data/kernel-dm-toolbox.db',
  },
});
