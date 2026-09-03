import isPropValid from '@emotion/is-prop-valid';

/**
 * Passed to styled-components' `StyleSheetManager` so transient styling props
 * (`variant`, `isPending`, …) are consumed by the style layer instead of being
 * forwarded to the DOM, where React would warn about unknown attributes.
 *
 * Custom components still receive every prop — only host elements are filtered.
 */
export const shouldForwardProp = (
  propName: string,
  elementToBeRendered: string | React.ComponentType<unknown>,
): boolean =>
  typeof elementToBeRendered === 'string' ? isPropValid(propName) : true;
