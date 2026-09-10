# syntax=docker/dockerfile:1

# One image, one campaign. The SQLite file lives on a mounted volume so the
# container itself stays disposable.

FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

# --- dependencies ----------------------------------------------------------
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# --- build -----------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Real values are injected at run time; the build only needs the schema to
# type-check, not to validate.
ENV SKIP_ENV_VALIDATION=1
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# --- runtime ---------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL=file:/data/kernel-dm-toolbox.db
ENV MAPS_STORAGE_DIR=/data/maps
ENV EFFECTS_STORAGE_DIR=/data/effects

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs \
 && mkdir -p /data && chown nextjs:nodejs /data

# `output: 'standalone'` traces exactly the files the server needs, so there is
# no node_modules install in this stage.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# The migration SQL is already inside .next/standalone: next.config.ts names it
# in outputFileTracingIncludes, because .sql files are invisible to import
# tracing. src/instrumentation.ts reads it at boot.
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000
VOLUME ["/data"]

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
