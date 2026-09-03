#!/bin/sh
set -e

# Migrations are applied by `src/instrumentation.ts` when the server boots, so
# this entrypoint only has to make sure the data directory exists and is ours.
mkdir -p "$(dirname "${DATABASE_URL#file:}")"

exec "$@"
