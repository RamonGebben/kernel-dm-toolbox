'use client';

import styled from 'styled-components';

/* Colour is deliberately not repeated here — it inherits from `Row`'s own
 * `$isDown` ternary, so the two can never drift out of sync with each
 * other. */
export const Initiative = styled.span`
  font-family: ${props => props.theme.fontFamily('mono')};
  font-weight: ${props => props.theme.fontWeight('bold')};
`;
