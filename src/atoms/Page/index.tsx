'use client';

import styled from 'styled-components';

/** A template's outermost wrapper: fills the viewport, and puts the
 * navigation rail beside the workspace from the `tabletLandscape` breakpoint up.
 * Carries no padding or gap of its own. */
export const Page = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;

  @media (min-width: ${props => props.theme.bp('tabletLandscape')}) {
    flex-direction: row;
  }
`;
