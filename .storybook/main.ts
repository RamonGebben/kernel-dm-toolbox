import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-vitest',
  ],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  viteFinal: async viteConfig => ({
    ...viteConfig,
    define: {
      ...viteConfig.define,
      // Stories render components in isolation with no real environment, so
      // env parsing is skipped rather than requiring every var to be present.
      'process.env.SKIP_ENV_VALIDATION': JSON.stringify('1'),
    },
  }),
};

export default config;
