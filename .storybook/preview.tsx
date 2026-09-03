import type { Preview } from '@storybook/nextjs-vite';
import { ThemeProvider } from 'styled-components';
import { GlobalStyle } from '../src/theme/GlobalStyle';
import { theme } from '../src/theme';
import { rawColors } from '../src/theme/colors';

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
        canvas: { name: 'Canvas', value: rawColors.canvas },
        surface: { name: 'Surface', value: rawColors.surface },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: 'canvas' },
  },
  decorators: [
    Story => (
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default preview;
