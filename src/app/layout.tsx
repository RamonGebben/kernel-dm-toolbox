import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { AppProviders } from '~/components/AppProviders';
import { themeColor } from '~/theme/colors';
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
 * A function rather than a static object: the title comes from a runtime
 * environment variable, so it must be resolved per request rather than frozen
 * into the build. See the note in `page.tsx`.
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

type RootLayoutProps = {
  children: React.ReactNode;
};

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
