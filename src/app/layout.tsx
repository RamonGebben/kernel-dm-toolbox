import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { AppProviders } from '~/providers/AppProviders';
import { themeColor } from '~/theme/tokens';
import { env } from '~/env';

const bodyFont = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

/**
 * Rendered per request, never prerendered — and set here, on the root layout,
 * because this layout is what reads `env`, so every page beneath it inherits
 * the dependency whether or not the page itself touches `env`.
 *
 * The image is built once with `SKIP_ENV_VALIDATION=1` and configured at
 * `docker run` time. A prerendered page would bake the build-time
 * `CAMPAIGN_NAME` into its `<title>` and ignore whatever the container was
 * actually started with (DECISIONS #6).
 */
export const dynamic = 'force-dynamic';

/**
 * A function rather than a static object: the title comes from a runtime
 * environment variable, so it must be resolved per request rather than frozen
 * into the build.
 */
export const generateMetadata = async (): Promise<Metadata> => ({
  title: env.CAMPAIGN_NAME,
  description: 'A dungeon master toolbox for a single campaign.',
});

/** Imports the same colour map the CSS does, rather than repeating a hex. */
export const viewport: Viewport = {
  themeColor,
  colorScheme: 'dark',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="en" className={`${bodyFont.variable} ${monoFont.variable}`}>
    <body>
      <AppProviders>{children}</AppProviders>
    </body>
  </html>
);

// Next.js file conventions require a default export; everywhere else in this
// codebase uses named exports.
export default RootLayout;
