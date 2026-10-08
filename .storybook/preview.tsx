import type { Preview } from '@storybook/nextjs-vite';
import { ThemeProvider } from '../src/providers/ThemeProvider';
import { theme } from '../src/theme';

/**
 * Every story renders inside the same theme and global styles the app uses, so
 * a component can never look right in Storybook and wrong in the app.
 */
const preview: Preview = {
  parameters: {
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    a11y: { test: 'error' },
    backgrounds: {
      options: {
        canvas: { name: 'Canvas', value: theme.rawColor('background') },
        surface: {
          name: 'Surface',
          value: theme.rawColor('background', 'emphasis'),
        },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: 'canvas' },
  },
  decorators: [
    Story => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default preview;
