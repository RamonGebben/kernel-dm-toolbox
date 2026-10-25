import type { SystemTokens } from '@pindakaasman/design-system';

/**
 * The single source of truth for every raw colour value in the app.
 *
 * Nothing else in the codebase may contain a hex value for a themed colour.
 * They are emitted once as CSS custom properties by `GlobalStyle`, and the
 * theme's accessors return `var(--…)` references to them.
 */
const palette = {
  // Surfaces, from furthest back to closest to the reader.
  canvas: '#0b0d12',
  surface: '#141822',
  surfaceRaised: '#1d2331',
  border: '#2b3346',

  // Text.
  textPrimary: '#e8ecf5',
  textMuted: '#94a0b8',
  textInverted: '#0b0d12',

  // Accent: the ember the whole toolbox is lit by.
  accent: '#e0904a',
  accentHover: '#f0a763',
  accentMuted: '#5c3d22',

  // Status.
  // Lightened from #e05a5a, which measured 4.32:1 against `surfaceRaised` and
  // failed WCAG AA — a selected combatant on 0 HP was the case that caught it.
  danger: '#e86b6b',
  success: '#5ac08a',
  warning: '#d9b155',
} as const;

const raised = '0 1px 2px rgb(0 0 0 / 0.4), 0 4px 12px rgb(0 0 0 / 0.3)';
const ember = `linear-gradient(135deg, ${palette.accent}, ${palette.accentHover})`;

/** The app is not responsive in type or spacing: one scale at every width. */
const fontSizes = {
  xxs: '10px',
  xs: '12px',
  s: '13px',
  base: '16px',
  m: '20px',
  l: '28px',
  xl: '32px',
} as const;

const spacingScale = {
  xxs: '2px',
  xs: '4px',
  s: '8px',
  base: '16px',
  m: '24px',
  l: '40px',
  xl: '48px',
} as const;

/**
 * Which palette colour sits in which design-system slot:
 *
 * | Slot                      | Colour          |
 * | ------------------------- | --------------- |
 * | `background`              | `canvas`        |
 * | `background`, `text`      | `textPrimary`   |
 * | `background`, `emphasis`  | `surface`       |
 * | `formBackground`          | `surfaceRaised` |
 * | `formBackground`, `text`  | `textMuted`     |
 * | `formBackground`, `emphasis` | `border`     |
 * | `primary`                 | `accent`        |
 * | `primary`, `text`         | `textInverted`  |
 * | `primary`, `emphasis`     | `accentHover`   |
 * | `secondary`               | `accentMuted`   |
 * | `error`                   | `danger`        |
 * | `tertiary`                | `success`       |
 * | `quaternary`              | `warning`       |
 *
 * There is one theme and it is dark. It lives under `modes.light` because
 * that is the design system's name for "the only mode"; with no `modes.dark`
 * the OS preference is ignored.
 */
export const tokens = {
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    tabletLandscape: '1024px',
    desktop: '1440px',
  },
  type: {
    baseFontSize: '16px',
    fontFamily: {
      base: 'var(--font-body)',
      heading: 'var(--font-body)',
      mono: 'var(--font-mono)',
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      base: 1.5,
      loose: 1.8,
    },
    sizes: {
      mobile: fontSizes,
      tablet: fontSizes,
      tabletLandscape: fontSizes,
      desktop: fontSizes,
    },
  },
  modes: {
    light: {
      colorPalette: {
        background: {
          base: palette.canvas,
          text: palette.textPrimary,
          emphasis: palette.surface,
        },
        formBackground: {
          base: palette.surfaceRaised,
          text: palette.textMuted,
          emphasis: palette.border,
        },
        primary: {
          base: palette.accent,
          text: palette.textInverted,
          emphasis: palette.accentHover,
        },
        secondary: {
          base: palette.accentMuted,
          text: palette.textPrimary,
          emphasis: palette.accent,
        },
        error: {
          base: palette.danger,
          text: palette.textInverted,
          emphasis: palette.danger,
        },
        tertiary: {
          base: palette.success,
          text: palette.textInverted,
          emphasis: palette.success,
        },
        quaternary: {
          base: palette.warning,
          text: palette.textInverted,
          emphasis: palette.warning,
        },
      },
      gradient: {
        menu: ember,
        hero: ember,
      },
      boxShadow: {
        base: '0 1px 2px rgb(0 0 0 / 0.4)',
        card: raised,
        modal: raised,
      },
    },
  },
  zIndex: {
    base: 0,
    dropdown: 100,
    sticky: 200,
    modal: 300,
    toast: 400,
  },
  spacing: {
    scale: {
      mobile: spacingScale,
      tablet: spacingScale,
      tabletLandscape: spacingScale,
      desktop: spacingScale,
    },
  },
  border: {
    radius: { s: '4px', base: '8px', full: '999px' },
    width: { s: '1px', base: '2px' },
  },
} satisfies SystemTokens;

/** `canvas` doubles as the browser theme colour and the PWA background. */
export const themeColor = tokens.modes.light.colorPalette.background.base;
