import 'styled-components';
import type { Theme } from '~/theme';

/**
 * Makes `props.theme` fully typed inside every styled-component, so a typo in
 * `theme.color.accnt` is a compile error rather than a silently missing value.
 */
declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends Theme {}
}
