'use client';

import styled from 'styled-components';

/**
 * A `div`, not a `p`: `FormattedText` can render block-level children (a
 * list, a table) that are invalid inside a `<p>`.
 */
export const EntryDesc = styled.div`
  margin: 0;
  white-space: pre-line;
  color: ${props => props.theme.color('formBackground', 'text')};
`;
