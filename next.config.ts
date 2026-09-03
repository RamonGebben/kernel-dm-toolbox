import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Emits `.next/standalone` with a self-contained `server.js`, so the Docker
   * runtime stage can ship without `node_modules`. See
   * `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/output.md`.
   */
  output: 'standalone',

  /**
   * Migration SQL is read from disk at boot by `src/instrumentation.ts`, but
   * `.sql` files are not reachable by import tracing, so they have to be named
   * explicitly or the standalone bundle ships without them.
   */
  outputFileTracingIncludes: {
    '/**': ['./src/server/db/migrations/**'],
  },

  /** Enables the styled-components SWC transform (SSR + stable class names). */
  compiler: {
    styledComponents: true,
  },

  /**
   * This instance is reached over the LAN by its host IP, not just localhost,
   * so `next dev` needs those origins allowed for its dev-time endpoints.
   */
  allowedDevOrigins: ['*.local', '192.168.0.0/16', '10.0.0.0/8'],

  typedRoutes: true,
};

export default nextConfig;
