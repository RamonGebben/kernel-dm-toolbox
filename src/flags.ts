import 'server-only';

/**
 * Feature gates.
 *
 * A gate is a server-only environment variable plus a named helper here — not a
 * flags SDK. Helpers are evaluated **server-side** in a page or route handler
 * and the result is passed down as a plain boolean prop; Client Components
 * never call these.
 *
 * The `server-only` import above turns a client import into a build error.
 * Flipping a gate requires a restart of the container — accepted, given one
 * deployment per campaign.
 *
 * No gate is defined yet — the initiative tracker, the first one this file
 * ever held, shipped and became the permanent flagship feature rather than a
 * gated one (see `CLAUDE.md`'s Navigation section). The next tool that needs
 * one goes here.
 */
