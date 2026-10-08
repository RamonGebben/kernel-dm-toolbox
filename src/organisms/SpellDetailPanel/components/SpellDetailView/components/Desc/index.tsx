'use client';

import styled from 'styled-components';

/**
 * A `div`, not a `p`: `FormattedText` can render block-level children (a
 * list, a table) that are invalid inside a `<p>`.
 */
export const Desc = styled.div`
  margin: 0;
  white-space: pre-line;
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('background', 'text')};
`;
